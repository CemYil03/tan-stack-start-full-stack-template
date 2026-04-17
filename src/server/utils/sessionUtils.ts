import type { GqlSSession } from '../graphql/generated';

const sessionIdCookieName = 'draw-schema-session-id';

function getSessionIdFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith(sessionIdCookieName + '='));

    if (!sessionCookie) return null;

    return sessionCookie.split('=')[1] ?? null;
}

type SameSite = 'Strict' | 'Lax' | 'None';

interface CookieOptions {
    name: string;
    value: string;
    expires?: Date;
    httpOnly?: boolean;
    sameSite?: SameSite;
    secure?: boolean;
    domain?: string;
}

export function createSetCookieString(options: CookieOptions): string {
    const { name, value, expires, httpOnly = true, sameSite = 'Strict', secure = true, domain } = options;

    // Start with the name and value
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    // Add optional properties
    if (expires) {
        cookieString += `; Expires=${expires.toUTCString()}`;
    }

    if (httpOnly) {
        cookieString += `; HttpOnly`;
    }

    if (secure) {
        cookieString += `; Secure`;
    }

    cookieString += `; SameSite=${sameSite}`;

    if (domain) {
        cookieString += `; Domain=${domain}`;
    }

    cookieString += `; Path=/`;

    return cookieString;
}

function createSetSessionCookie(session: GqlSSession): string {
    const sessionLifetimeMs = 365 * 24 * 60 * 60 * 1000;
    const secure = process.env.sessionCookieSecure === 'true';

    return createSetCookieString({
        name: sessionIdCookieName,
        value: session.sessionId,
        expires: new Date(Date.now() + sessionLifetimeMs),
        httpOnly: true,
        sameSite: secure ? 'None' : 'Lax',
        secure,
        domain: process.env.sessionCookieDomainScope,
    });
}

function clearSessionCookie(): string {
    return `${sessionIdCookieName}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}

export const sessionUtils = {
    getSessionIdFromRequest,
    createSetSessionCookie,
    clearSessionCookie,
};
