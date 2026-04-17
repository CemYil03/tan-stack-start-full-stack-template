import type { Database } from '../db';
import { logs } from '../db/schema';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type LogInput = unknown;
type LogSession = { sessionId: string } | null | undefined;

export interface Logger {
    error: (input: LogInput, session?: LogSession) => void;
    warn: (input: LogInput, session?: LogSession) => void;
    info: (input: LogInput, session?: LogSession) => void;
    debug: (input: LogInput, session?: LogSession) => void;
}

function normalize(input: LogInput): { message: string; context: Record<string, unknown> | undefined } {
    if (input instanceof Error) {
        return { message: input.message, context: { name: input.name, stack: input.stack } };
    }
    return { message: String(input), context: undefined };
}

function logPersist(db: Database, level: LogLevel, message: string, sessionId?: string, context?: Record<string, unknown>) {
    db.insert(logs).values({ logId: crypto.randomUUID(), level, message, sessionId, context }).catch(console.error);
}

export function loggerCreate(db: Database): Logger {
    function log(level: LogLevel, input: LogInput, session?: LogSession) {
        const { message, context } = normalize(input);
        console[level](message, context);
        logPersist(db, level, message, session?.sessionId, context);
    }

    return {
        error: (input, session) => log('error', input, session),
        warn: (input, session) => log('warn', input, session),
        info: (input, session) => log('info', input, session),
        debug: (input, session) => log('debug', input, session),
    };
}
