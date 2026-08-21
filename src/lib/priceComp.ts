/**
 * Price comparison helpers.
 *
 * This is intentionally NOT a scraper — StockX and Grailed both disallow
 * automated scraping in their terms of service. Instead we build a search
 * URL for each site so an admin can open it in a new tab and eyeball
 * comparable listings/sold prices themselves.
 */

export function buildQuery(brand: string, title: string): string {
  return [brand, title].filter(Boolean).join(" ").trim();
}

export function stockXSearchUrl(brand: string, title: string): string {
  const query = buildQuery(brand, title);
  return `https://stockx.com/search?s=${encodeURIComponent(query)}`;
}

export function grailedSearchUrl(brand: string, title: string): string {
  const query = buildQuery(brand, title);
  return `https://www.grailed.com/shop?query=${encodeURIComponent(query)}`;
}
