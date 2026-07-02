import pool from "../config/db";
import { OPPORTUNITY_TYPES, OpportunityType } from "../modules/opportunities/opportunity.constants";
import { createCandidateForUser } from "../modules/opportunity-candidates/opportunityCandidate.service";
import {
  findScoutGoalForUser,
  isScoutGoalDue,
  listScoutGoalsForUser,
  markScoutGoalRun,
  ScoutGoal,
} from "../modules/scout-goals/scoutGoal.service";
import { searchWeb, WebSearchResult } from "./webSearch.service";

export interface ScoutSummary {
  queriesRun: number;
  rawResultsFound: number;
  candidatesCreated: number;
  skippedDuplicates: number;
  candidates: unknown[];
}

export interface DueScoutGoalResult {
  scoutGoalId: number;
  title: string;
  summary: ScoutSummary | null;
  error?: string;
}

export interface DueScoutRunSummary {
  goalsChecked: number;
  goalsRun: number;
  totalCandidatesCreated: number;
  results: DueScoutGoalResult[];
}

export class ScoutGoalNotFoundError extends Error {
  constructor() {
    super("Scout Goal not found.");
  }
}

const ACTION_WORDS = [
  "apply",
  "application",
  "contact",
  "careers",
  "hiring",
  "scholarship",
  "funding",
  "grant",
  "tender",
  "proposal",
  "admissions",
  "school",
  "business",
];

const IRRELEVANT_WORDS = [
  "casino",
  "betting",
  "adult",
  "porn",
  "lottery",
  "crypto giveaway",
];

const TYPE_WORDS: Record<OpportunityType, string[]> = {
  job: ["remote", "developer", "frontend", "angular", "hiring", "career"],
  scholarship: ["scholarship", "funded", "masters", "deadline", "apply"],
  school_pilot: ["school", "basic school", "private school", "admissions", "contact"],
  client_lead: ["business", "services", "contact", "company"],
  contract: ["tender", "procurement", "proposal", "contract"],
  grant: ["grant", "funding", "startup", "innovation"],
  business: ["business", "startup", "company", "funding"],
  research: ["research", "program", "grant", "funding"],
  other: ["opportunity", "application", "contact"],
};

// Types worth generating dedicated search queries for when a goal targets
// 'all' categories. 'other' is left out here — it's a catch-all fallback
// for classification, not a distinct thing to search for.
const ALL_MODE_TYPES: OpportunityType[] = OPPORTUNITY_TYPES.filter(
  (type) => type !== "other"
) as OpportunityType[];

// Cap total queries per run when a goal targets 'all' categories, so a
// single run doesn't fan out into dozens of Tavily calls.
const ALL_MODE_MAX_QUERIES = 12;
const ALL_MODE_QUERIES_PER_TYPE = 2;

function cleanPart(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

function compactQuery(query: string) {
  return query.replace(/\s+/g, " ").trim().slice(0, 400);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function queryTemplatesForType(
  scoutGoal: Pick<ScoutGoal, "title" | "keywords" | "location">,
  type: OpportunityType
): string[] {
  const title = cleanPart(scoutGoal.title);
  const keywords = cleanPart(scoutGoal.keywords, title);
  const location = cleanPart(scoutGoal.location, "Ghana");

  const byType: Record<OpportunityType, string[]> = {
    school_pilot: [
      `${keywords} ${location}`,
      `private basic schools ${location} Ghana contact email`,
      `schools in ${location} Ghana website`,
      "school management parent communication Ghana",
      "private schools Ghana admissions contact",
    ],
    job: [
      `${keywords} remote apply`,
      `${keywords} job ${location}`,
      `remote ${keywords} developer`,
      `${keywords} hiring application`,
    ],
    scholarship: [
      `${keywords} scholarship application deadline`,
      `${keywords} masters funding`,
      `${keywords} fully funded scholarship`,
      `${keywords} graduate program funding`,
    ],
    client_lead: [
      `${keywords} ${location}`,
      `businesses in ${location} need automation`,
      `small businesses ${location} contact`,
      `${keywords} services Ghana contact`,
    ],
    contract: [
      `${keywords} tender Ghana`,
      `${keywords} procurement Ghana`,
      `${keywords} contract opportunity`,
      `${keywords} request for proposal`,
    ],
    grant: [
      `${keywords} grant application`,
      `${keywords} startup funding`,
      `${keywords} funding opportunity Ghana`,
      `${keywords} innovation grant`,
    ],
    business: [
      `${title} ${location}`,
      `${keywords} ${location}`,
      `${keywords} opportunity`,
      `${keywords} application`,
    ],
    research: [
      `${title} ${location}`,
      `${keywords} ${location}`,
      `${keywords} opportunity`,
      `${keywords} application`,
    ],
    other: [
      `${title} ${location}`,
      `${keywords} ${location}`,
      `${keywords} opportunity`,
      `${keywords} application`,
    ],
  };

  return byType[type] ?? byType.other;
}

export function generateScoutQueries(scoutGoal: ScoutGoal): string[] {
  if (scoutGoal.type === "all") {
    const combined = ALL_MODE_TYPES.flatMap((type) =>
      queryTemplatesForType(scoutGoal, type).slice(0, ALL_MODE_QUERIES_PER_TYPE)
    );

    return uniqueStrings(combined.map(compactQuery)).slice(0, ALL_MODE_MAX_QUERIES);
  }

  return uniqueStrings(
    queryTemplatesForType(scoutGoal, scoutGoal.type).map(compactQuery)
  ).slice(0, 5);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[\s,;|/]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

function importantKeywords(scoutGoal: Pick<ScoutGoal, "title" | "keywords">) {
  const rawKeywords = [
    ...tokenize(scoutGoal.title),
    ...tokenize(scoutGoal.keywords ?? ""),
  ];
  const ignored = new Set(["the", "and", "for", "with", "from", "this", "that", "your"]);

  return uniqueStrings(rawKeywords.filter((word) => !ignored.has(word))).slice(0, 12);
}

function containsAny(text: string, words: string[]) {
  const lowerText = text.toLowerCase();
  return words.some((word) => lowerText.includes(word.toLowerCase()));
}

function looksOfficial(result: WebSearchResult) {
  const text = `${result.title} ${result.url}`.toLowerCase();

  return (
    text.includes(".edu") ||
    text.includes(".gov") ||
    text.includes(".org") ||
    text.includes("official") ||
    text.includes("university") ||
    text.includes("ministry") ||
    text.includes("school") ||
    text.includes("careers")
  );
}

/**
 * Determines which opportunity type a search result best matches, by
 * counting keyword hits against every type's word list. Used for 'all'
 * category scout goals, where a single run has no single fixed type to
 * score against and each result must be classified individually.
 */
export function inferBestType(result: WebSearchResult): OpportunityType {
  const combined = `${result.title} ${result.snippet}`.toLowerCase();

  let bestType: OpportunityType = "other";
  let bestMatches = 0;

  for (const type of ALL_MODE_TYPES) {
    const words = TYPE_WORDS[type] ?? [];
    const matches = words.filter((word) => combined.includes(word.toLowerCase())).length;

    if (matches > bestMatches) {
      bestMatches = matches;
      bestType = type;
    }
  }

  return bestMatches > 0 ? bestType : "other";
}

export function scoreResult(
  result: WebSearchResult,
  scoutGoal: Pick<ScoutGoal, "title" | "keywords" | "location">,
  effectiveType: OpportunityType
): number {
  const title = result.title.toLowerCase();
  const snippet = result.snippet.toLowerCase();
  const combined = `${title} ${snippet}`;
  const keywords = importantKeywords(scoutGoal);
  const typeWords = TYPE_WORDS[effectiveType] ?? TYPE_WORDS.other;
  let score = 0;

  if (containsAny(title, keywords)) score += 25;
  if (containsAny(snippet, keywords)) score += 20;

  if (scoutGoal.location && containsAny(combined, [scoutGoal.location])) {
    score += 15;
  }

  if (containsAny(combined, ACTION_WORDS)) score += 10;
  if (looksOfficial(result)) score += 10;
  if (containsAny(combined, typeWords)) score += 10;
  if (containsAny(combined, IRRELEVANT_WORDS)) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function normalizeUrl(url: string) {
  return url.trim().replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
}

async function alreadyExistsForUser(userId: number, url: string) {
  const normalizedUrl = normalizeUrl(url);
  const result = await pool.query(
    `
      SELECT id FROM opportunity_candidates
      WHERE user_id = $1 AND lower(trim(trailing '/' from link)) = $2
      UNION
      SELECT id FROM opportunities
      WHERE user_id = $1 AND lower(trim(trailing '/' from link)) = $2
      LIMIT 1
    `,
    [userId, normalizedUrl]
  );

  return (result.rowCount ?? 0) > 0;
}

function inferOrganization(title: string) {
  const separators = [" - ", " | ", " at ", " from "];

  for (const separator of separators) {
    const parts = title.split(separator);
    if (parts.length > 1) {
      const organization = parts[parts.length - 1].trim();
      return organization || null;
    }
  }

  return null;
}

export async function runScoutGoal(
  userId: number,
  scoutGoalId: number
): Promise<ScoutSummary> {
  const scoutGoal = await findScoutGoalForUser(userId, scoutGoalId);

  if (!scoutGoal) {
    throw new ScoutGoalNotFoundError();
  }

  const queries = generateScoutQueries(scoutGoal);
  const seenUrls = new Set<string>();
  const dedupedResults: WebSearchResult[] = [];
  let rawResultsFound = 0;

  for (const query of queries) {
    const results = await searchWeb(query, {
      maxResults: 5,
      topic: "general",
      searchDepth: "basic",
    });

    rawResultsFound += results.length;

    for (const result of results) {
      const normalizedUrl = normalizeUrl(result.url);

      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
      dedupedResults.push(result);
    }
  }

  const candidates = [];
  let skippedDuplicates = 0;
  const minimumScore = scoutGoal.minimumScore ?? 70;

  for (const result of dedupedResults) {
    const effectiveType: OpportunityType =
      scoutGoal.type === "all" ? inferBestType(result) : scoutGoal.type;

    const score = scoreResult(result, scoutGoal, effectiveType);

    if (score < minimumScore) {
      continue;
    }

    if (await alreadyExistsForUser(userId, result.url)) {
      skippedDuplicates += 1;
      continue;
    }

    const candidate = await createCandidateForUser(userId, {
      scoutGoalId,
      title: result.title,
      type: effectiveType,
      organization: inferOrganization(result.title),
      source: "Tavily Web Search",
      link: result.url,
      score,
      whyItMatters: `This result matches your scout goal: ${scoutGoal.title}. It may be worth reviewing because it matches your keywords and opportunity type.`,
      suggestedNextAction:
        "Open the link, confirm the details, and decide whether to approve this as an active opportunity.",
      status: "pending",
    });

    candidates.push(candidate);
  }

  await markScoutGoalRun(scoutGoalId);

  return {
    queriesRun: queries.length,
    rawResultsFound,
    candidatesCreated: candidates.length,
    skippedDuplicates,
    candidates,
  };
}

/**
 * Runs every active scout goal for a user whose schedule (frequency +
 * last_run_at) says it's due right now. This is what powers unattended
 * automation (e.g. a daily Hermes cron job) instead of requiring the user
 * to click "Run" by hand.
 */
export async function runDueScoutGoalsForUser(userId: number): Promise<DueScoutRunSummary> {
  const goals = await listScoutGoalsForUser(userId);
  const dueGoals = goals.filter((goal) => isScoutGoalDue(goal));

  const results: DueScoutGoalResult[] = [];
  let totalCandidatesCreated = 0;

  for (const goal of dueGoals) {
    try {
      const summary = await runScoutGoal(userId, goal.id);
      totalCandidatesCreated += summary.candidatesCreated;
      results.push({ scoutGoalId: goal.id, title: goal.title, summary });
    } catch (error) {
      results.push({
        scoutGoalId: goal.id,
        title: goal.title,
        summary: null,
        error: error instanceof Error ? error.message : "Unknown error while running this scout goal.",
      });
    }
  }

  return {
    goalsChecked: goals.length,
    goalsRun: dueGoals.length,
    totalCandidatesCreated,
    results,
  };
}
