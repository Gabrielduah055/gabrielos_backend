import { Response } from "express";
import { AuthRequest } from "../../middleware/firebaseAuth.middleware";
import {
  searchWeb,
  TavilyConfigurationError,
  TavilySearchError,
} from "../../services/webSearch.service";

const DEFAULT_QUERY =
  "latest technology, career, funding, and job market news";

export async function getHeadlines(req: AuthRequest, res: Response) {
  const topic = typeof req.query.q === "string" && req.query.q.trim()
    ? req.query.q.trim()
    : DEFAULT_QUERY;

  try {
    const results = await searchWeb(topic, {
      topic: "news",
      searchDepth: "basic",
      maxResults: 8,
    });

    res.json({
      query: topic,
      headlines: results,
    });
  } catch (error) {
    if (error instanceof TavilyConfigurationError) {
      return res.status(503).json({
        message: "News search is not configured.",
      });
    }

    if (error instanceof TavilySearchError) {
      return res.status(502).json({
        message: "Failed to fetch news headlines.",
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Something went wrong fetching news headlines.",
    });
  }
}
