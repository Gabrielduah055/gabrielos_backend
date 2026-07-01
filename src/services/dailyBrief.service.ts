import pool from "../config/db";

export interface DailyBriefPendingCandidateSummary {
  id: number;
  title: string;
  type: string | null;
  score: number;
  organization: string | null;
}

export interface DailyBriefFollowUpItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  nextAction: string | null;
}

export interface DailyBriefDeadlineItem {
  id: number;
  title: string;
  sourceTable: "opportunity_candidates" | "opportunities";
  deadline: Date;
  daysUntil: number;
}

export interface DailyBriefData {
  generatedAt: string;
  pendingCandidates: {
    total: number;
    byType: Record<string, number>;
    topScored: DailyBriefPendingCandidateSummary[];
  };
  opportunitiesNeedingFollowUp: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    items: DailyBriefFollowUpItem[];
  };
  upcomingDeadlines: DailyBriefDeadlineItem[];
}

const FOLLOW_UP_STATUSES = [
  "interested",
  "contacted",
  "applied",
  "follow_up",
  "negotiating",
];

export async function buildDailyBrief(
  userId: number,
  opts: { deadlineWindowDays?: number; topScoredLimit?: number } = {}
): Promise<DailyBriefData> {
  const deadlineWindowDays = opts.deadlineWindowDays ?? 7;
  const topScoredLimit = opts.topScoredLimit ?? 5;

  const pendingResult = await pool.query<DailyBriefPendingCandidateSummary>(
    `
      SELECT id, title, type, score, organization
      FROM opportunity_candidates
      WHERE user_id = $1 AND status = 'pending'
      ORDER BY score DESC, created_at DESC
    `,
    [userId]
  );

  const pendingCandidates = pendingResult.rows;
  const byType: Record<string, number> = {};
  for (const candidate of pendingCandidates) {
    const key = candidate.type ?? "other";
    byType[key] = (byType[key] ?? 0) + 1;
  }

  const followUpResult = await pool.query<DailyBriefFollowUpItem>(
    `
      SELECT id, title, status, priority, next_action AS "nextAction"
      FROM opportunities
      WHERE user_id = $1 AND status = ANY($2::text[])
      ORDER BY
        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        updated_at DESC
    `,
    [userId, FOLLOW_UP_STATUSES]
  );

  const followUpItems = followUpResult.rows;
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  for (const opportunity of followUpItems) {
    byStatus[opportunity.status] = (byStatus[opportunity.status] ?? 0) + 1;
    byPriority[opportunity.priority] = (byPriority[opportunity.priority] ?? 0) + 1;
  }

  const deadlineResult = await pool.query<{
    id: number;
    title: string;
    sourceTable: string;
    deadline: Date;
  }>(
    `
      SELECT id, title, 'opportunity_candidates' AS "sourceTable", deadline
      FROM opportunity_candidates
      WHERE user_id = $1 AND deadline IS NOT NULL
        AND deadline BETWEEN NOW() AND NOW() + make_interval(days => $2::integer)
      UNION ALL
      SELECT id, title, 'opportunities' AS "sourceTable", deadline
      FROM opportunities
      WHERE user_id = $1 AND deadline IS NOT NULL
        AND deadline BETWEEN NOW() AND NOW() + make_interval(days => $2::integer)
      ORDER BY deadline ASC
    `,
    [userId, deadlineWindowDays]
  );

  const now = Date.now();
  const upcomingDeadlines: DailyBriefDeadlineItem[] = deadlineResult.rows.map(
    (row) => ({
      id: row.id,
      title: row.title,
      sourceTable: row.sourceTable as "opportunity_candidates" | "opportunities",
      deadline: row.deadline,
      daysUntil: Math.ceil(
        (new Date(row.deadline).getTime() - now) / (1000 * 60 * 60 * 24)
      ),
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    pendingCandidates: {
      total: pendingCandidates.length,
      byType,
      topScored: pendingCandidates.slice(0, topScoredLimit),
    },
    opportunitiesNeedingFollowUp: {
      total: followUpItems.length,
      byStatus,
      byPriority,
      items: followUpItems,
    },
    upcomingDeadlines,
  };
}
