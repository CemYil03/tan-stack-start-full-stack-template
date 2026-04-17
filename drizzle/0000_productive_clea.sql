CREATE TABLE "Logs" (
	"logId" uuid PRIMARY KEY NOT NULL,
	"sessionId" uuid,
	"level" varchar NOT NULL,
	"message" varchar NOT NULL,
	"context" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Sessions" (
	"sessionId" uuid PRIMARY KEY NOT NULL,
	"userId" uuid,
	"lastInteractionAt" timestamp with time zone DEFAULT now() NOT NULL,
	"wasTerminatedAt" timestamp with time zone,
	"connectionActive" boolean DEFAULT false NOT NULL,
	"userAgent" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_sessionId_Sessions_sessionId_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Sessions"("sessionId") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_Users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("userId") ON DELETE set null ON UPDATE cascade;