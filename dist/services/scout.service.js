"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoutGoalNotFoundError = void 0;
exports.generateScoutQueries = generateScoutQueries;
exports.scoreResult = scoreResult;
exports.runScoutGoal = runScoutGoal;
const db_1 = __importDefault(require("../config/db"));
const opportunityCandidate_service_1 = require("../modules/opportunity-candidates/opportunityCandidate.service");
const scoutGoal_service_1 = require("../modules/scout-goals/scoutGoal.service");
const webSearch_service_1 = require("./webSearch.service");
class ScoutGoalNotFoundError extends Error {
    constructor() {
        super("Scout Goal not found.");
    }
}
exports.ScoutGoalNotFoundError = ScoutGoalNotFoundError;
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
const TYPE_WORDS = {
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
function cleanPart(value, fallback = "") {
    return value?.trim() || fallback;
}
function compactQuery(query) {
    return query.replace(/\s+/g, " ").trim().slice(0, 400);
}
function uniqueStrings(values) {
    return Array.from(new Set(values.filter(Boolean)));
}
function generateScoutQueries(scoutGoal) {
    const title = cleanPart(scoutGoal.title);
    const keywords = cleanPart(scoutGoal.keywords, title);
    const location = cleanPart(scoutGoal.location, "Ghana");
    const byType = {
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
    return uniqueStrings((byType[scoutGoal.type] ?? byType.other).map(compactQuery)).slice(0, 5);
}
function tokenize(value) {
    return value
        .toLowerCase()
        .split(/[\s,;|/]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2);
}
function importantKeywords(scoutGoal) {
    const rawKeywords = [
        ...tokenize(scoutGoal.title),
        ...tokenize(scoutGoal.keywords ?? ""),
    ];
    const ignored = new Set(["the", "and", "for", "with", "from", "this", "that", "your"]);
    return uniqueStrings(rawKeywords.filter((word) => !ignored.has(word))).slice(0, 12);
}
function containsAny(text, words) {
    const lowerText = text.toLowerCase();
    return words.some((word) => lowerText.includes(word.toLowerCase()));
}
function looksOfficial(result) {
    const text = `${result.title} ${result.url}`.toLowerCase();
    return (text.includes(".edu") ||
        text.includes(".gov") ||
        text.includes(".org") ||
        text.includes("official") ||
        text.includes("university") ||
        text.includes("ministry") ||
        text.includes("school") ||
        text.includes("careers"));
}
function scoreResult(result, scoutGoal) {
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    const combined = `${title} ${snippet}`;
    const keywords = importantKeywords(scoutGoal);
    const typeWords = TYPE_WORDS[scoutGoal.type] ?? TYPE_WORDS.other;
    let score = 0;
    if (containsAny(title, keywords))
        score += 25;
    if (containsAny(snippet, keywords))
        score += 20;
    if (scoutGoal.location && containsAny(combined, [scoutGoal.location])) {
        score += 15;
    }
    if (containsAny(combined, ACTION_WORDS))
        score += 10;
    if (looksOfficial(result))
        score += 10;
    if (containsAny(combined, typeWords))
        score += 10;
    if (containsAny(combined, IRRELEVANT_WORDS))
        score -= 20;
    return Math.max(0, Math.min(100, score));
}
function normalizeUrl(url) {
    return url.trim().replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
}
async function alreadyExistsForUser(userId, url) {
    const normalizedUrl = normalizeUrl(url);
    const result = await db_1.default.query(`
      SELECT id FROM opportunity_candidates
      WHERE user_id = $1 AND lower(trim(trailing '/' from link)) = $2
      UNION
      SELECT id FROM opportunities
      WHERE user_id = $1 AND lower(trim(trailing '/' from link)) = $2
      LIMIT 1
    `, [userId, normalizedUrl]);
    return (result.rowCount ?? 0) > 0;
}
function inferOrganization(title) {
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
async function runScoutGoal(userId, scoutGoalId) {
    const scoutGoal = await (0, scoutGoal_service_1.findScoutGoalForUser)(userId, scoutGoalId);
    if (!scoutGoal) {
        throw new ScoutGoalNotFoundError();
    }
    const queries = generateScoutQueries(scoutGoal);
    const seenUrls = new Set();
    const dedupedResults = [];
    let rawResultsFound = 0;
    for (const query of queries) {
        const results = await (0, webSearch_service_1.searchWeb)(query, {
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
        const score = scoreResult(result, scoutGoal);
        if (score < minimumScore) {
            continue;
        }
        if (await alreadyExistsForUser(userId, result.url)) {
            skippedDuplicates += 1;
            continue;
        }
        const candidate = await (0, opportunityCandidate_service_1.createCandidateForUser)(userId, {
            scoutGoalId,
            title: result.title,
            type: scoutGoal.type,
            organization: inferOrganization(result.title),
            source: "Tavily Web Search",
            link: result.url,
            score,
            whyItMatters: `This result matches your scout goal: ${scoutGoal.title}. It may be worth reviewing because it matches your keywords and opportunity type.`,
            suggestedNextAction: "Open the link, confirm the details, and decide whether to approve this as an active opportunity.",
            status: "pending",
        });
        candidates.push(candidate);
    }
    return {
        queriesRun: queries.length,
        rawResultsFound,
        candidatesCreated: candidates.length,
        skippedDuplicates,
        candidates,
    };
}
//# sourceMappingURL=scout.service.js.map