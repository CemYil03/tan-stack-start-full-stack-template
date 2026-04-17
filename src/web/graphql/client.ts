import { createClient, fetchExchange, subscriptionExchange } from 'urql';
import { createClient as createSSEClient } from 'graphql-sse';

// Custom fetch function for URQL that always uses POST
const urqlPostFetch: typeof fetch = async (url, options) => {
    // Normalize URL to string
    const urlString = typeof url === 'string' ? url : url instanceof URL ? url.href : url.toString();

    const urlObj = new URL(urlString, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

    // Check if this is a GET request (either method is GET or query params are in URL)
    const isGetRequest = (!options || !options.method || options.method === 'GET') && urlObj.searchParams.has('query');

    // If it's a GET request with query params, convert to POST
    if (isGetRequest) {
        const query = urlObj.searchParams.get('query');
        const variables = urlObj.searchParams.get('variables');

        return fetch(urlObj.pathname, {
            ...options,
            method: 'POST',
            headers: {
                ...options?.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: variables ? JSON.parse(variables) : undefined,
            }),
            credentials: options?.credentials || 'same-origin',
        });
    }

    // For all other requests, ensure POST method and proper headers
    return fetch(url, {
        ...options,
        method: options?.method || 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        credentials: options?.credentials || 'same-origin',
    });
};

// Create SSE client for subscriptions
// SSE uses GET requests by default, which is standard for Server-Sent Events
const sseClient = createSSEClient({
    url: '/api/stream',
    // Don't use custom fetch - let it use GET requests (standard for SSE)
    credentials: 'same-origin', // Important: sends cookies with requests
});

// Create URQL client
export const urqlClient = createClient({
    url: '/api/graphql',
    fetch: urqlPostFetch, // Custom fetch that always uses POST
    fetchOptions: {
        method: 'POST', // Force POST method
        credentials: 'same-origin', // Important: sends cookies with requests
    },
    preferGetMethod: false, // Always use POST for all GraphQL operations
    requestPolicy: 'cache-first',
    exchanges: [
        fetchExchange,
        subscriptionExchange({
            forwardSubscription: (operation) => {
                return {
                    subscribe: (sink) => {
                        const dispose = sseClient.subscribe(operation as any, sink);
                        return {
                            unsubscribe: dispose,
                        };
                    },
                };
            },
        }),
    ],
});

// Even simpler client without subscriptions
export const urqlClientSimple = createClient({
    url: '/api/graphql',
    fetch: urqlPostFetch, // Custom fetch that always uses POST
    fetchOptions: {
        method: 'POST', // Force POST method
        credentials: 'same-origin',
    },
    preferGetMethod: false, // Always use POST for all GraphQL operations
    exchanges: [fetchExchange], // No caching at all - ultra lightweight
});
