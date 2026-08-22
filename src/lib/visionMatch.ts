/**
 * Visual match search via Google Cloud Vision's Web Detection feature — the
 * same underlying tech behind Google Lens. Given a photo, it asks Google for
 * pages across the whole web that contain a visually matching or similar
 * image, then keeps only the ones hosted on a verified resale marketplace —
 * see VERIFIED_RESELLERS below. Everything else Vision finds (blogs, image
 * aggregators, unrelated storefronts, etc.) is dropped rather than shown.
 *
 * This does not scrape these marketplaces directly — it calls Google's own
 * paid API and filters whichever public page URLs come back, same as any
 * other legitimate use of a search API.
 */

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

/**
 * Resale marketplaces that authenticate (or otherwise vet) what they sell,
 * roughly in the order matches are displayed. To widen or narrow which
 * sites visual-match results are limited to, add/remove entries here — that
 * one change flows through filtering, sorting, and the UI label together.
 */
const VERIFIED_RESELLERS = [
  { source: "stockx", label: "StockX", hosts: ["stockx.com"] },
  { source: "grailed", label: "Grailed", hosts: ["grailed.com"] },
  { source: "goat", label: "GOAT", hosts: ["goat.com"] },
  { source: "flightclub", label: "Flight Club", hosts: ["flightclub.com"] },
  { source: "stadiumgoods", label: "Stadium Goods", hosts: ["stadiumgoods.com"] },
  { source: "therealreal", label: "The RealReal", hosts: ["therealreal.com"] },
  { source: "vestiairecollective", label: "Vestiaire Collective", hosts: ["vestiairecollective.com"] },
  { source: "fashionphile", label: "Fashionphile", hosts: ["fashionphile.com"] },
  { source: "rebag", label: "Rebag", hosts: ["rebag.com"] },
] as const;

export type MatchSource = (typeof VERIFIED_RESELLERS)[number]["source"];

/** Display label for each source, e.g. `RESELLER_LABELS.stockx === "StockX"`. */
export const RESELLER_LABELS: Record<MatchSource, string> = Object.fromEntries(
  VERIFIED_RESELLERS.map((r) => [r.source, r.label])
) as Record<MatchSource, string>;

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

/** Returns the matching reseller's source key, or null if the URL's host isn't on the allowlist. */
function classifySource(url: string): MatchSource | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const reseller of VERIFIED_RESELLERS) {
      if (reseller.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
        return reseller.source;
      }
    }
  } catch {
    // malformed URL — treat as unmatched
  }
  return null;
}

/** Strips the "data:image/...;base64," prefix a Photo.dataUrl is stored with. */
function base64Content(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

/**
 * Runs a Web Detection lookup for a single photo (as a data URL) and
 * returns matching pages that live on a verified resale marketplace (see
 * VERIFIED_RESELLERS), sorted in that same marketplace order and capped to
 * a reasonable number to show in the UI. Pages Vision finds anywhere else
 * on the web are discarded.
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
          // Ask for more than we'll show since most results get filtered
          // out by the verified-reseller allowlist below.
          features: [{ type: "WEB_DETECTION", maxResults: 50 }],
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
    const source = classifySource(page.url);
    if (!source) continue; // not a verified reseller — drop it
    seen.add(page.url);
    matches.push({
      url: page.url,
      title: page.pageTitle?.trim() || null,
      source,
    });
  }

  // Group by marketplace in the order VERIFIED_RESELLERS lists them, and
  // keep Vision's own confidence order within each group.
  const rank = new Map(VERIFIED_RESELLERS.map((r, i) => [r.source, i]));
  matches.sort((a, b) => (rank.get(a.source) ?? 99) - (rank.get(b.source) ?? 99));

  const bestGuess: string | null = webDetection?.bestGuessLabels?.[0]?.label ?? null;

  return { matches: matches.slice(0, 12), bestGuess };
}