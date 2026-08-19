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
});

// ─── Votes on community submissions ──────────────────────────────────────────

export const votes = pgTable("votes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().references(() => communitySubmissions.id),
  vote:         text("vote").notNull(), // 'worked' | 'didnt_work'
  voterIpHash:  text("voter_ip_hash").notNull(),
  createdAt:    timestamp("created_at").defaultNow(),
});

// ─── Change reports on curated freebies ──────────────────────────────────────

export const changeReports = pgTable("change_reports", {
  id:             uuid("id").primaryKey().defaultRandom(),
  freebieId:      text("freebie_id").notNull(),
  description:    text("description").notNull(),
  reporterIpHash: text("reporter_ip_hash").notNull(),
  trueVotes:      integer("true_votes").notNull().default(0),
  falseVotes:     integer("false_votes").notNull().default(0),
  status:         text("status").notNull().default("open"), // open | resolved | dismissed
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
