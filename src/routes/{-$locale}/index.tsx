import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../web/components/base/tooltip';
import { routeLoaderGraphqlClient } from '../../web/graphql/routeLoaderGraphqlClient';
import { HomePageDocument } from '../../web/graphql/generated';
import { useLocale } from '../../web/hooks/useLocale';
import { LanguageSwitcher } from '../../web/components/LanguageSwitcher';

export const Route = createFileRoute('/{-$locale}/')({
    loader: routeLoaderGraphqlClient(HomePageDocument),
    component: HomePage,
});

function HomePage() {
    const loaderData = Route.useLoaderData();
    const locale = useLocale();

    return (
        <main className="p-8">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">{{ de: 'Willkommen', en: 'Welcome' }[locale]}</h1>
                <LanguageSwitcher />
            </div>
            <div>
                {{ de: 'Angemeldeter Benutzer', en: 'Signed in user' }[locale]}{' '}
                {loaderData.currentSession.user?.name || { de: 'keiner', en: 'none' }[locale]}
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" className="mt-4 cursor-pointer" onClick={() => toast('Test')}>
                        {{ de: 'Benachrichtigung', en: 'Alert' }[locale]}
                    </button>
                </TooltipTrigger>
                <TooltipContent>{{ de: 'Hallo Welt!', en: 'Hello world!' }[locale]}</TooltipContent>
            </Tooltip>
        </main>
    );
}
