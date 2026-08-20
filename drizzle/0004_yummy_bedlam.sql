ALTER TABLE "change_reports" ALTER COLUMN "freebie_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "change_reports" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "change_reports" ADD COLUMN "proposed_changes" text;--> statement-breakpoint
ALTER TABLE "community_submissions" ADD COLUMN "deal_condition" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_submissions" ADD COLUMN "minimum_purchase_amount" integer;--> statement-breakpoint
ALTER TABLE "community_submissions" ADD COLUMN "prior_purchase_period" text;--> statement-breakpoint
ALTER TABLE "change_reports" ADD CONSTRAINT "change_reports_submission_id_community_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."community_submissions"("id") ON DELETE no action ON UPDATE no action;