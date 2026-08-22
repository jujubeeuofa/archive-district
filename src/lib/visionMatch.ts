/**
 * Visual match search via Google Cloud Vision's Web Detection feature — the
 * same underlying tech behind Google Lens. Given a photo, it returns pages
 * across the web that contain a visually matching or similar image.
 *
 * This is NOT a replacement for priceComp.ts's search-link generator, and it
 * does not scrape StockX/Grailed directly — it calls Google's own paid API
 * and simply surfaces whichever public page URLs come back, same as any
 * other legitimate use of a search API. Results aren't limited to StockX/
 * Grailed; we just sort those to the top when they show up.
 */

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

export type MatchSource = "stockx" | "grailed" | "other";

export type VisualMatch = {
  url: string;
  title: string | null;
  source: MatchSource;
};

export type VisualMatchResult = {
  matches: VisualMatch[];
  bestGuess: string | null;
};

export function visionConfigured(): boolean {
  return !!process.env.GOOGLE_VISION_API_KEY;
}

function classifySource(url: string): MatchSource {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "stockx.com" || host.endsWith(".stockx.com")) return "stockx";
    if (host === "grailed.com" || host.endsWith(".grailed.com")) return "grailed";
  } catch {
    // malformed URL — fall through to "other"
  }
  return "other";
}

/** Strips the "data:image/...;base64," prefix a Photo.dataUrl is stored with. */
function base64Content(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

/**
 * Runs a Web Detection lookup for a single photo (as a data URL) and
 * returns matching pages, sorted with StockX/Grailed hits first, capped to
 * a reasonable number to show in the UI.
 */
export async function findVisualMatches(dataUrl: string): Promise<VisualMatchResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_VISION_API_KEY is not set");
  }

  const res = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64Content(dataUrl) },
          features: [{ type: "WEB_DETECTION", maxResults: 20 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vision API request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const webDetection = json?.responses?.[0]?.webDetection;
  const apiError = json?.responses?.[0]?.error;
  if (apiError) {
    throw new Error(`Vision API error: ${apiError.message || "unknown error"}`);
  }

  const pages: Array<{ url?: string; pageTitle?: string }> = webDetection?.pagesWithMatchingImages ?? [];

  const seen = new Set<string>();
  const matches: VisualMatch[] = [];
  for (const page of pages) {
    if (!page.url || seen.has(page.url)) continue;
    seen.add(page.url);
    matches.push({
      url: page.url,
      title: page.pageTitle?.trim() || null,
      source: classifySource(page.url),
    });
  }

  // Marketplace hits first, then everything else, each in the order Vision
  // returned them (it already ranks by match confidence).
  matches.sort((a, b) => {
    const rank = (m: VisualMatch) => (m.source === "other" ? 1 : 0);
    return rank(a) - rank(b);
  });

  const bestGuess: string | null = webDetection?.bestGuessLabels?.[0]?.label ?? null;

  return { matches: matches.slice(0, 12), bestGuess };
}