CREATE TABLE "change_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freebie_id" text NOT NULL,
	"description" text NOT NULL,
	"reporter_ip_hash" text NOT NULL,
	"true_votes" integer DEFAULT 0 NOT NULL,
	"false_votes" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"category" text NOT NULL,
	"what_you_get" text NOT NULL,
	"claim_method" text NOT NULL,
	"requirements" text[] DEFAULT '{}' NOT NULL,
	"claim_window" text NOT NULL,
	"claim_window_notes" text,
	"source_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"worked_votes" integer DEFAULT 0 NOT NULL,
	"didnt_work_votes" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"submitter_ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"vote" text NOT NULL,
	"voter_ip_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_submission_id_community_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."community_submissions"("id") ON DELETE no action ON UPDATE no action;