-- Create users table
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint

-- Create a default user for existing data
INSERT INTO "users" ("id", "email", "password_hash", "name") 
VALUES ('00000000-0000-0000-0000-000000000000', 'default@system.local', '$2a$10$placeholder', 'Sistema');
--> statement-breakpoint

-- Add user_id columns as nullable first
ALTER TABLE "activities" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "user_id" uuid;--> statement-breakpoint

-- Update existing records with default user
UPDATE "activities" SET "user_id" = '00000000-0000-0000-0000-000000000000' WHERE "user_id" IS NULL;--> statement-breakpoint
UPDATE "questions" SET "user_id" = '00000000-0000-0000-0000-000000000000' WHERE "user_id" IS NULL;--> statement-breakpoint
UPDATE "rooms" SET "user_id" = '00000000-0000-0000-0000-000000000000' WHERE "user_id" IS NULL;--> statement-breakpoint

-- Make columns NOT NULL
ALTER TABLE "activities" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;