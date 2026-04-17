import { db } from '../db';
import { jobEnqueue } from '../jobs/boss';
import { PubSubPostgres } from '../graphql/PubSubPostgres';
import { loggerCreate } from '../utils/loggerCreate';
import type { ServerRuntime } from './ServerRuntime';

export function serverRuntimeCreate(): ServerRuntime {
    const postgresPubSub = new PubSubPostgres({ db });

    async function publish(keys: Array<string> | string, payload: any) {
        await (typeof keys === 'string'
            ? postgresPubSub.publish(keys, payload)
            : Promise.all(keys.map((key: string) => postgresPubSub.publish(key, payload))));
    }

    const serverRuntime: ServerRuntime = {
        db,
        log: loggerCreate(db),
        subscribe: {
            to: (key: string) => postgresPubSub.asyncIterableIterator([key]),
        },
        publish: {
            userUpdates: ({ userId }) => publish(userId, {}),
            generationChunkUpdates: ({ generationId, chunk }) => publish(generationId, chunk),
        },
        jobs: {
            enqueue: jobEnqueue,
        },
    };

    return serverRuntime;
}
