CREATE TABLE "draws" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"admin_key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY,
	"draw_id" text NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL UNIQUE,
	"recipient_id" text NOT NULL,
	"opened_at" timestamp with time zone,
	"position" integer NOT NULL,
	CONSTRAINT "participants_draw_id_id_unique" UNIQUE("draw_id","id"),
	CONSTRAINT "participants_draw_id_name_unique" UNIQUE("draw_id","name"),
	CONSTRAINT "participants_draw_id_recipient_id_unique" UNIQUE("draw_id","recipient_id"),
	CONSTRAINT "participants_draw_id_position_unique" UNIQUE("draw_id","position"),
	CONSTRAINT "participants_no_self_assignment" CHECK ("id" <> "recipient_id"),
	CONSTRAINT "participants_position_range" CHECK ("position" >= 0 AND "position" < 8)
);
--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_draw_id_draws_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draws"("id");--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_recipient_same_draw_fk" FOREIGN KEY ("draw_id","recipient_id") REFERENCES "participants"("draw_id","id");