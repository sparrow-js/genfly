CREATE TABLE "usage" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"modelName" text NOT NULL,
	"provider" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;