import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Community Submissions ────────────────────────────────────────────────────

export const communitySubmissions = pgTable("community_submissions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  businessName:    text("business_name").notNull(),
  category:        text("category").notNull(),
  whatYouGet:      text("what_you_get").notNull(),
  claimMethod:     text("claim_method").notNull(),
  requirements:    text("requirements").array().notNull().default([]),
  claimWindow:     text("claim_window").notNull(),
  claimWindowNotes:text("claim_window_notes"),
  sourceUrl:       text("source_url").notNull(),
  status:          text("status").notNull().default("pending"),
  workedVotes:     integer("worked_votes").notNull().default(0),
  didntWorkVotes:  integer("didnt_work_votes").notNull().default(0),
  submittedAt:     timestamp("submitted_at").defaultNow(),
  submitterIpHash: text("submitter_ip_hash"),
  /** "national" | "regional" | "local" */
  coverageType:    text("coverage_type").notNull().default("national"),
  /** Cities/regions where this freebie is confirmed available */
  availableCities: text("available_cities").array().notNull().default([]),
  /** For claimWindow="birthday-custom": days before birthday the window opens */
  claimWindowDaysBefore: integer("claim_window_days_before"),
  /** For claimWindow="birthday-custom": days after birthday the window closes */
  claimWindowDaysAfter:  integer("claim_window_days_after"),
  /** "none" | "any-purchase" | "min-purchase" | "prior-purchase" */
  dealCondition:         text("deal_condition").notNull().default("none"),
  /** For dealCondition="min-purchase": minimum spend in dollars */
  minimumPurchaseAmount: integer("minimum_purchase_amount"),
  /** For dealCondition="prior-purchase": e.g. "within the past year" */
  priorPurchasePeriod:   text("prior_purchase_period"),
});

// ─── Votes on community submissions ──────────────────────────────────────────

export const votes = pgTable("votes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().references(() => communitySubmissions.id),
  vote:         text("vote").notNull(), // 'worked' | 'didnt_work'
  voterIpHash:  text("voter_ip_hash").notNull(),
  createdAt:    timestamp("created_at").defaultNow(),
});

// ─── Change reports on freebies (curated or community) ───────────────────────

export const changeReports = pgTable("change_reports", {
  id:             uuid("id").primaryKey().defaultRandom(),
  /** String ID of a curated freebie (e.g. "starbucks-birthday-drink"). Null if targeting a community submission. */
  freebieId:      text("freebie_id"),
  /** UUID of a community submission. Null if targeting a curated freebie. */
  submissionId:   uuid("submission_id").references(() => communitySubmissions.id),
  /** Human-readable description of what changed */
  description:    text("description").notNull(),
  /**
   * Structured proposed change — JSON string of ChangeProposal.
   * Fields: dealCondition?, minimumPurchaseAmount?, priorPurchasePeriod?,
   *         whatYouGet?, claimWindow?, isActive?
   * If null, the report is descriptive only (no auto-apply possible).
   */
  proposedChanges: text("proposed_changes"),
  reporterIpHash: text("reporter_ip_hash").notNull(),
  trueVotes:      integer("true_votes").notNull().default(0),
  falseVotes:     integer("false_votes").notNull().default(0),
  /**
   * open        — awaiting votes
   * escalated   — True votes hit threshold; awaiting admin action (curated) or auto-applied (community)
   * resolved    — change applied / confirmed
   * dismissed   — False votes dominant or admin dismissed
   */
  status:         text("status").notNull().default("open"),
  createdAt:      timestamp("created_at").defaultNow(),
});

// ─── City reports — "I've seen this freebie in [city]" ───────────────────────

export const cityReports = pgTable("city_reports", {
  id:             uuid("id").primaryKey().defaultRandom(),
  submissionId:   uuid("submission_id").notNull().references(() => communitySubmissions.id),
  city:           text("city").notNull(),
  reporterIpHash: text("reporter_ip_hash").notNull(),
  /** WGS-84 coordinates from geocoding — null if geocoding failed */
  latitude:       doublePrecision("latitude"),
  longitude:      doublePrecision("longitude"),
  createdAt:      timestamp("created_at").defaultNow(),
});

export type CommunitySubmissionRow = typeof communitySubmissions.$inferSelect;
export type NewCommunitySubmission = typeof communitySubmissions.$inferInsert;
export type ChangeReportRow        = typeof changeReports.$inferSelect;
export type CityReportRow          = typeof cityReports.$inferSelect;

/**
 * Structured proposed change — stored as JSON in change_reports.proposed_changes.
 * Only whitelisted fields may be auto-applied to prevent arbitrary data injection.
 */
export interface ChangeProposal {
  dealCondition?:         "none" | "any-purchase" | "min-purchase" | "prior-purchase";
  minimumPurchaseAmount?: number;
  priorPurchasePeriod?:   string;
  whatYouGet?:            string;
  claimWindow?:           string;
  isActive?:              false; // Can only deactivate, never re-activate via vote
}

/** Minimum votes to escalate/auto-apply. True votes must also be ≥ 3× false votes. */
export const CHANGE_REPORT_THRESHOLD = 5;
