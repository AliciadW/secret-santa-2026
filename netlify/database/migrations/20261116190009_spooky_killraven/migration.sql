ALTER TABLE "participants" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "email_status" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "email_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "participants" DROP CONSTRAINT "participants_position_range", ADD CONSTRAINT "participants_position_range" CHECK ("position" >= 0);