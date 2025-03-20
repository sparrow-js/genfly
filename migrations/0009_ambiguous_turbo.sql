CREATE TABLE "credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"usage" integer DEFAULT 0 NOT NULL,
	"modelName" text,
	"provider" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "usage" CASCADE;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;