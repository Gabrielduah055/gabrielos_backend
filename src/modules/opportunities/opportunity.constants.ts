export const OPPORTUNITY_TYPES = [
  "job",
  "scholarship",
  "school_pilot",
  "client_lead",
  "contract",
  "business",
  "research",
  "grant",
  "other",
] as const;

// Scout goals may additionally target 'all' — a single goal that searches
// every opportunity type in one run. Candidates/opportunities themselves
// always keep a concrete type (never 'all'), so they stay filterable.
export const SCOUT_GOAL_TYPES = [...OPPORTUNITY_TYPES, "all"] as const;

export const SCOUT_GOAL_FREQUENCIES = ["daily", "weekly", "monthly"] as const;

export const CANDIDATE_STATUSES = [
  "pending",
  "approved",
  "ignored",
  "rejected",
] as const;

export const OPPORTUNITY_STATUSES = [
  "saved",
  "interested",
  "contacted",
  "applied",
  "follow_up",
  "negotiating",
  "won",
  "lost",
  "archived",
] as const;

export const OPPORTUNITY_PRIORITIES = ["low", "medium", "high"] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export type ScoutGoalType = (typeof SCOUT_GOAL_TYPES)[number];
export type ScoutGoalFrequency = (typeof SCOUT_GOAL_FREQUENCIES)[number];
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type OpportunityPriority = (typeof OPPORTUNITY_PRIORITIES)[number];

export function isAllowedValue<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}
