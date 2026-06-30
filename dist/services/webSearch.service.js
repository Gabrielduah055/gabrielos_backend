"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TavilySearchError = exports.TavilyConfigurationError = void 0;
exports.searchWeb = searchWeb;
class TavilyConfigurationError extends Error {
    constructor() {
        super("Tavily API key is not configured.");
    }
}
exports.TavilyConfigurationError = TavilyConfigurationError;
class TavilySearchError extends Error {
    constructor() {
        super("Scout failed while searching the web.");
    }
}
exports.TavilySearchError = TavilySearchError;
async function searchWeb(query, options = {}) {
    const provider = (process.env.SEARCH_PROVIDER ?? "tavily").trim().toLowerCase();
    if (provider !== "tavily" && provider !== "travily") {
        throw new TavilySearchError();
    }
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
        throw new TavilyConfigurationError();
    }
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                search_depth: options.searchDepth ?? "basic",
                topic: options.topic ?? "general",
                max_results: options.maxResults ?? 5,
                include_answer: false,
                include_raw_content: false,
                include_images: false,
            }),
        });
        if (!response.ok) {
            throw new TavilySearchError();
        }
        const payload = (await response.json());
        return (payload.results ?? [])
            .filter((result) => result.title && result.url)
            .map((result) => ({
            title: result.title ?? "",
            url: result.url ?? "",
            snippet: result.content ?? result.snippet ?? "",
            source: "Tavily",
        }));
    }
    catch (error) {
        if (error instanceof TavilyConfigurationError) {
            throw error;
        }
        throw new TavilySearchError();
    }
}
//# sourceMappingURL=webSearch.service.js.map