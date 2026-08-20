export type FreebieCategory =
  | "food-drink"
  | "retail"
  | "beauty"
  | "entertainment"
  | "online";

export type ClaimMethod = "in-store" | "online" | "app" | "both";

/**
 * The purchase condition required to claim the freebie AT THE TIME OF VISIT.
 * Membership / rewards sign-up prerequisites live in `requirements[]` — not here.
 * This axis is strictly about what money (if any) must change hands that day.
 */
export type DealCondition =
  | "none"            // Nothing required — just show up (or open the app)
  | "any-purchase"    // Must buy something, any amount
  | "min-purchase"    // Must spend at least $X — see minimumPurchaseAmount
  | "prior-purchase"; // Must have been a paying customer before — see priorPurchasePeriod

export type ClaimWindow =
  | "birthday-day-only"
  | "birthday-week"
  | "birthday-month"
  | "any-time"        // some don't require proof of birth date
  | "birthday-custom"; // X days before through Y days after — see claimWindowDaysBefore/After

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
  /** For "birthday-custom": days before birthday the window opens (0 = birthday day itself) */
  claimWindowDaysBefore?: number | null;
  /** For "birthday-custom": days after birthday the window closes (0 = expires on birthday) */
  claimWindowDaysAfter?: number | null;
  /** Purchase condition required at the time of claiming — see DealCondition */
  dealCondition: DealCondition;
  /** For dealCondition="min-purchase": minimum spend in dollars */
  minimumPurchaseAmount?: number | null;
  /** For dealCondition="prior-purchase": human-readable period, e.g. "within the past year" */
  priorPurchasePeriod?: string | null;
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
