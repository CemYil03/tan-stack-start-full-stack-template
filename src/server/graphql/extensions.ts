import './generated';

declare module './generated' {
    export interface GqlSSession {
        userId?: string | null | undefined;
    }
    export interface GqlSUserMutation {
        userId: string;
    }
}
