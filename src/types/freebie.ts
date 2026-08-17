export type FreebieCategory =
  | "food-drink"
  | "retail"
  | "beauty"
  | "entertainment"
  | "online";

export type ClaimMethod = "in-store" | "online" | "app" | "both";

export type ClaimWindow =
  | "birthday-day-only"
  | "birthday-week"
  | "birthday-month"
  | "any-time"; // some don't require proof of birth date

export type FreebieSource = "curated" | "community";

export type ChangeReportStatus = "open" | "resolved" | "dismissed";

// ─── Core Freebie ────────────────────────────────────────────────────────────

export interface Freebie {
  id: string;
  businessName: string;
  category: FreebieCategory;
  /** Short, specific description: "Free Rooty Tooty Fresh 'N Fruity pancake breakfast" not "free meal" */
  whatYouGet: string;
  claimMethod: ClaimMethod;
  /** Any hoops required before or during claiming */
  requirements: string[];
  claimWindow: ClaimWindow;
  /** Notes on how the window actually works */
  claimWindowNotes?: string;
  /** E.g., must sign up at least 7 days before birthday */
  registrationDeadline?: string;
  /** Verified source URL for this freebie */
  sourceUrl: string;
  source: FreebieSource;
  /** ISO date string when this entry was last verified */
  lastVerified: string;
  isActive: boolean;
  /** Tags for supplemental filtering */
  tags?: string[];
  /** Set when enough users have flagged this as changed */
  changeFlag?: ChangeFlagSummary;
}

// ─── Change Reporting ─────────────────────────────────────────────────────────

export interface ChangeFlagSummary {
  /** Number of users who flagged this freebie as changed */
  reportCount: number;
  /** Most recent reported description of the change */
  latestDescription: string;
  /** Number of users who voted "True" (yes, it changed) */
  trueVotes: number;
  /** Number of users who voted "False" (no, it hasn't changed) */
  falseVotes: number;
  status: ChangeReportStatus;
}

// ─── Community Submissions ───────────────────────────────────────────────────

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface CommunitySubmission extends Omit<Freebie, "id" | "source" | "lastVerified" | "isActive" | "changeFlag"> {
  id: string;
  source: "community";
  submittedAt: string; // ISO date
  status: SubmissionStatus;
  /** Votes from users who tried it */
  workedVotes: number;
  didntWorkVotes: number;
}

// ─── localStorage State ───────────────────────────────────────────────────────

export interface UserFreebieState {
  /** IDs of freebies the user has checked off */
  checkedIds: string[];
  /** IDs of freebies the user has removed from their view */
  removedIds: string[];
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface FreebieFilters {
  search: string;
  category: FreebieCategory | "all";
  claimMethod: ClaimMethod | "all";
}
