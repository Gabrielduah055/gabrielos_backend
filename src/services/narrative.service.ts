import { getOpenAIClient, isOpenAIConfigured } from "../config/open_ai";
import { DailyBriefData } from "./dailyBrief.service";

export type NarrativeSource = "openai" | "template";

export interface DailyBriefNarrative {
  narrative: string;
  source: NarrativeSource;
}

function countHighScored(brief: DailyBriefData, threshold = 80): number {
  return brief.pendingCandidates.topScored.filter((c) => c.score >= threshold)
    .length;
}

function buildTemplateNarrative(brief: DailyBriefData): string {
  const parts: string[] = [];

  const { total: pendingTotal } = brief.pendingCandidates;
  const highScored = countHighScored(brief);

  if (pendingTotal > 0) {
    parts.push(
      `${pendingTotal} pending lead${pendingTotal === 1 ? "" : "s"}` +
        (highScored > 0 ? ` (${highScored} scored 80+)` : "")
    );
  } else {
    parts.push("No new pending leads");
  }

  const followUpTotal = brief.opportunitiesNeedingFollowUp.total;
  if (followUpTotal > 0) {
    parts.push(
      `${followUpTotal} opportunit${followUpTotal === 1 ? "y" : "ies"} need${
        followUpTotal === 1 ? "s" : ""
      } follow-up`
    );
  }

  const deadlineCount = brief.upcomingDeadlines.length;
  if (deadlineCount > 0) {
    const soonest = brief.upcomingDeadlines[0];
    parts.push(
      `${deadlineCount} deadline${deadlineCount === 1 ? "" : "s"} in the next 7 days (soonest: "${soonest.title}" in ${soonest.daysUntil} day${soonest.daysUntil === 1 ? "" : "s"})`
    );
  }

  return `Daily Brief: ${parts.join(". ")}.`;
}

/**
 * Generates a natural-language summary of the daily brief. Uses OpenAI when
 * configured, but NEVER throws - any failure (missing key, network, quota,
 * malformed response) falls back to a deterministic template so the
 * /api/service/daily-brief endpoint always returns a usable narrative.
 */
export async function generateDailyBriefNarrative(
  brief: DailyBriefData
): Promise<DailyBriefNarrative> {
  if (!isOpenAIConfigured()) {
    return { narrative: buildTemplateNarrative(brief), source: "template" };
  }

  try {
    const client = getOpenAIClient();
    if (!client) {
      return { narrative: buildTemplateNarrative(brief), source: "template" };
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write short, warm, practical daily briefings for a personal opportunity-tracking assistant. 2-4 sentences max. No markdown, no bullet points, no greeting/sign-off - just the briefing content.",
        },
        {
          role: "user",
          content: `Summarize this daily brief data for the user:\n${JSON.stringify(
            brief
          )}`,
        },
      ],
      max_tokens: 200,
    });

    const narrative = completion.choices[0]?.message?.content?.trim();

    if (!narrative) {
      return { narrative: buildTemplateNarrative(brief), source: "template" };
    }

    return { narrative, source: "openai" };
  } catch (error) {
    console.error("OpenAI narrative generation failed, falling back to template:", error);
    return { narrative: buildTemplateNarrative(brief), source: "template" };
  }
}
