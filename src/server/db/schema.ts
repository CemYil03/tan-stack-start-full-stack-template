import { boolean, foreignKey, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const sessions = pgTable(
    'Sessions',
    {
        sessionId: uuid().primaryKey(),
        userId: uuid(),
        lastInteractionAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
        wasTerminatedAt: timestamp({ withTimezone: true }),
        connectionActive: boolean().notNull().default(false),
        userAgent: varchar(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.userId],
        })
            .onUpdate('cascade')
            .onDelete('set null'),
    ],
);

export type SessionCreate = typeof sessions.$inferInsert;
export type Session = typeof sessions.$inferSelect;

export const logs = pgTable(
    'Logs',
    {
        logId: uuid().primaryKey(),
        sessionId: uuid(),
        level: varchar().notNull(),
        message: varchar().notNull(),
        context: jsonb(),
        createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.sessionId],
            foreignColumns: [sessions.sessionId],
        })
            .onUpdate('cascade')
            .onDelete('set null'),
    ],
);

export type Log = typeof logs.$inferSelect;
export type LogCreate = typeof logs.$inferInsert;

export const users = pgTable('Users', {
    userId: uuid().primaryKey(),
    name: varchar().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type UserCreate = typeof users.$inferInsert;
