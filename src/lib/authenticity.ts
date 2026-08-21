/**
 * Authenticity-check checklist templates.
 *
 * These are general starting points drawn from widely known legit-check
 * heuristics (hardware weight, stamping consistency, tag/font details,
 * construction quality) — NOT a substitute for hands-on expertise or a
 * paid authentication service, and not official brand documentation.
 * Treat them as a checklist to structure the review and create a record,
 * refine the wording from your own experience as you go, and route
 * anything genuinely uncertain to a professional authenticator
 * (e.g. Entrupy, Real Authentication, or the brand itself) before listing.
 */

export type ChecklistItemTemplate = {
  id: string;
  label: string;
};

const GENERIC_CHECKLIST: ChecklistItemTemplate[] = [
  { id: "generic-marks", label: "Maker's marks / logo stamps are sharp, correctly placed, and consistent with authentic references" },
  { id: "generic-materials", label: "Materials, hardware weight, and stitching quality are consistent with authentic production (not noticeably light, glued, or uneven)" },
  { id: "generic-serial", label: "Serial number / date code / tag (if the item has one) is present, legible, and in the correct format for its era" },
  { id: "generic-proportions", label: "Proportions, font, and logo placement match authentic reference photos — no stretched, thin, or misaligned lettering" },
  { id: "generic-provenance", label: "Seller could provide proof of purchase, original packaging, or other provenance (noted even if not required)" },
  { id: "generic-red-flags", label: "No common replica red flags present (mismatched hardware finish, wrong font weight, incorrect packaging/dust bag, chemical smell)" },
];

const BRAND_CHECKLISTS: Record<string, ChecklistItemTemplate[]> = {
  "chrome hearts": [
    { id: "ch-hallmark", label: "925 silver hallmark is stamped clearly; piece's weight feels consistent with solid sterling (not hollow/light)" },
    { id: "ch-font", label: "Font on cross/dagger motifs matches authentic CH gothic serif — no rounded, thin, or generic knockoff lettering" },
    { id: "ch-engraving", label: "Floral scroll engraving looks hand-finished and slightly irregular (cast/laser replicas tend to look too uniform or shallow)" },
    { id: "ch-hardware", label: "Leather goods have the woven CH logo tag and correct silver-tone hardware finish, not brassy or plated-looking" },
    { id: "ch-packaging", label: "Box, dust bag, and papers (if present) match current Chrome Hearts packaging and printing quality" },
  ],
  "rick owens": [
    { id: "ro-fabric", label: "Fabric weight and drape are consistent with authentic mainline/DRKSHDW construction, not a lighter knockoff fabric" },
    { id: "ro-label", label: "Interior label font, placement, and wash-care tag details match authentic tagging" },
    { id: "ro-stitching", label: "Signature asymmetric seams and raw-edge finishing are present and deliberate, not just uneven sewing" },
  ],
  supreme: [
    { id: "sup-boxlogo", label: "Box logo proportions, font, and red color match the specific season's authentic release" },
    { id: "sup-label", label: "Woven label stitching, placement, and thread color are consistent with authentic examples from that drop" },
    { id: "sup-tags", label: "Size tag and care tag details (font, placement, country of origin) match known-authentic references for the era" },
  ],
  "louis vuitton": [
    { id: "lv-datecode", label: "Date code is stamped, legible, and its format matches the construction era of the piece" },
    { id: "lv-canvas", label: "Monogram canvas pattern aligns symmetrically at seams and corners, as on authentic pieces" },
    { id: "lv-hardware", label: "Hardware is stamped \"LOUIS VUITTON\" with correct font weight and finish, not shiny plated brass" },
  ],
  gucci: [
    { id: "gucci-serial", label: "Serial number tag is present, stitched in cleanly, with correct font" },
    { id: "gucci-hardware", label: "Interlocking GG hardware finish and weight are consistent with authentic pieces" },
    { id: "gucci-zippers", label: "Zipper pulls are stamped with the correct manufacturer mark for the piece's era (e.g. Lampo/Riri on vintage Gucci)" },
  ],
};

/** Builds the checklist template for a given brand: generic items first, then brand-specific ones (if we have any). */
export function getChecklistTemplate(brand: string): ChecklistItemTemplate[] {
  const key = brand.trim().toLowerCase();
  const brandItems = BRAND_CHECKLISTS[key] ?? [];
  return [...GENERIC_CHECKLIST, ...brandItems];
}

export function hasBrandSpecificChecklist(brand: string): boolean {
  return Boolean(BRAND_CHECKLISTS[brand.trim().toLowerCase()]);
}

export type ChecklistEntry = {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
};

/**
 * Rebuilds a checklist result array from a submitted <AuthenticityChecklist>
 * form, against the brand's *current* template (so ids/labels always
 * reflect what the reviewer actually saw on screen — the template itself
 * is not stored, just this filled-out snapshot).
 */
export function parseChecklistFromFormData(brand: string, formData: FormData): ChecklistEntry[] {
  const template = getChecklistTemplate(brand);
  return template.map((t) => ({
    id: t.id,
    label: t.label,
    checked: formData.get(`check__${t.id}`) === "on",
    note: String(formData.get(`note__${t.id}`) || "").trim() || undefined,
  }));
}
