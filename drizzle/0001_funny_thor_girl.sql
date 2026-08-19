CREATE TABLE "city_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"city" text NOT NULL,
	"reporter_ip_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "community_submissions" ADD COLUMN "coverage_type" text DEFAULT 'national' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_submissions" ADD COLUMN "available_cities" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "city_reports" ADD CONSTRAINT "city_reports_submission_id_community_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."community_submissions"("id") ON DELETE no action ON UPDATE no action;