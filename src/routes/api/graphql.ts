import { createFileRoute } from '@tanstack/react-router';
import { executeGraphQLQuery } from '../../server/graphql/server';
import { sessionUtils } from '../../server/utils/sessionUtils';
import { sessionUpsert } from '../../server/utils/sessionUpsert';
import { db } from '../../server/db';
import { loggerCreate } from '../../server/utils/loggerCreate';

const log = loggerCreate(db);

export const Route = createFileRoute('/api/graphql')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                // Create session context from session cookie
                const existingSessionId = sessionUtils.getSessionIdFromRequest(request);
                const session = await sessionUpsert(db, log, existingSessionId, request.headers.get('user-agent'));

                try {
                    const body = await request.clone().json();
                    const result = await executeGraphQLQuery(body.query, body.variables, session);

                    return new Response(JSON.stringify(result), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Set-Cookie': sessionUtils.createSetSessionCookie(session),
                        },
                    });
                } catch (error: any) {
                    return new Response(JSON.stringify({ errors: [{ message: error.message }] }), {
                        status: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            'Set-Cookie': sessionUtils.createSetSessionCookie(session),
                        },
                    });
                }
            },
        },
    },
});
