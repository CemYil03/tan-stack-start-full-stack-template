import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../web/components/base/tooltip';
import { routeLoaderGraphqlClient } from '../web/graphql/routeLoaderGraphqlClient';
import { HomePageDocument } from '../web/graphql/generated';

export const Route = createFileRoute('/')({
    loader: routeLoaderGraphqlClient(HomePageDocument),
    component() {
        const loaderData = Route.useLoaderData();

        return (
            <main className="p-8">
                <div>Signed in user {loaderData.currentSession.user?.name || 'none'}</div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" className="cursor-pointer" onClick={() => toast('Test')}>
                            Alert
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Hello world!</TooltipContent>
                </Tooltip>
            </main>
        );
    },
});
