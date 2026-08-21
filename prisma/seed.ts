import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { solidColorDataUrl, colorForIndex } from "./placeholder-image";
import {
  Role,
  ItemStatus,
  AuthenticityStatus,
  ItemSource,
  SubmissionStatus,
  OrderStatus,
  TenderType,
} from "../src/lib/enums";
import { getChecklistTemplate } from "../src/lib/authenticity";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

export async function main() {
  console.log("Seeding database...");

  // --- Users ---
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Jacob (Admin)",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
      phone: "555-010-0001",
    },
  });

  const clientData = [
    { name: "Marcus Bell", email: "client1@example.com", phone: "555-010-0101" },
    { name: "Priya Nair", email: "client2@example.com", phone: "555-010-0102" },
    { name: "Dante Ruiz", email: "client3@example.com", phone: "555-010-0103" },
  ];

  const clients = [];
  for (const c of clientData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash,
        role: Role.CLIENT,
        phone: c.phone,
      },
    });
    clients.push(user);
  }

  // --- Inventory items (heavy Chrome Hearts focus) ---
  type SeedItem = {
    title: string;
    brand: string;
    category: string;
    condition: string;
    description: string;
    costPrice: number;
    listPrice: number;
    soldPrice?: number;
    status: ItemStatus;
    authenticityStatus: AuthenticityStatus;
    source: ItemSource;
  };

  const items: SeedItem[] = [
    {
      title: "Classic Cross Ring, Silver, Size 10",
      brand: "Chrome Hearts",
      category: "Rings",
      condition: "Excellent",
      description: "925 sterling silver classic cross ring. Hallmarked, minor wear on band.",
      costPrice: 380,
      listPrice: 695,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.AUTHENTICATED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "Dagger Cross Ring, Size 9.5",
      brand: "Chrome Hearts",
      category: "Rings",
      condition: "Good",
      description: "Dagger cross detail, some patina consistent with age, cleans up well.",
      costPrice: 420,
      listPrice: 750,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "Floral Cross Pendant Necklace",
      brand: "Chrome Hearts",
      category: "Necklaces",
      condition: "Excellent",
      description: "Sterling silver floral cross pendant on 22in rolo chain.",
      costPrice: 900,
      listPrice: 1595,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cross Stud Earrings (Pair)",
      brand: "Chrome Hearts",
      category: "Jewelry",
      condition: "Excellent",
      description: "Small cross stud earrings, sold as a pair, screw backs.",
      costPrice: 260,
      listPrice: 475,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "CH Cross Patch Hoodie, Black, L",
      brand: "Chrome Hearts",
      category: "Hoodies",
      condition: "Excellent",
      description: "Black heavyweight hoodie with embroidered cross patch chest logo.",
      costPrice: 650,
      listPrice: 1150,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.AUTHENTICATED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Horseshoe Logo Hoodie, Grey, XL",
      brand: "Chrome Hearts",
      category: "Hoodies",
      condition: "Good",
      description: "Heather grey hoodie, horseshoe graphic on back, light pilling.",
      costPrice: 520,
      listPrice: 950,
      status: ItemStatus.SOLD,
      soldPrice: 900,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cemetery Cross Tee, White, M",
      brand: "Chrome Hearts",
      category: "T-Shirts",
      condition: "Excellent",
      description: "White short sleeve tee, cemetery cross back print.",
      costPrice: 220,
      listPrice: 425,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "CH Leather Cross Wallet, Black",
      brand: "Chrome Hearts",
      category: "Wallets",
      condition: "Excellent",
      description: "Bifold black leather wallet with silver cross snap, lightly used.",
      costPrice: 480,
      listPrice: 850,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.AUTHENTICATED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cross Zip Wallet, Brown Leather",
      brand: "Chrome Hearts",
      category: "Wallets",
      condition: "Good",
      description: "Zip-around wallet, brown leather, sterling cross zipper pull.",
      costPrice: 510,
      listPrice: 895,
      status: ItemStatus.SOLD,
      soldPrice: 850,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "CH Cyrus Sunglasses, Matte Black",
      brand: "Chrome Hearts",
      category: "Eyewear",
      condition: "Excellent",
      description: "Matte black acetate frame, silver cross temple hardware, case included.",
      costPrice: 340,
      listPrice: 625,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cauterize Sunglasses, Tortoise",
      brand: "Chrome Hearts",
      category: "Eyewear",
      condition: "Excellent",
      description: "Tortoise shell acetate, gold-tone cross hardware.",
      costPrice: 360,
      listPrice: 650,
      status: ItemStatus.HELD,
      authenticityStatus: AuthenticityStatus.FLAGGED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "CH Trucker Hat, Black/White",
      brand: "Chrome Hearts",
      category: "Hats",
      condition: "Excellent",
      description: "Mesh-back trucker hat, embroidered horseshoe logo.",
      costPrice: 140,
      listPrice: 275,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cross Motif Belt, Black Leather, 34",
      brand: "Chrome Hearts",
      category: "Belts",
      condition: "Good",
      description: "Black leather belt, sterling silver cross buckle, size 34.",
      costPrice: 560,
      listPrice: 975,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "Rick Owens DRKSHDW Ramones High-Top, 43",
      brand: "Rick Owens",
      category: "Sneakers",
      condition: "Good",
      description: "Black leather high-top, some creasing, box not included.",
      costPrice: 310,
      listPrice: 575,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.AUTHENTICATED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "Rick Owens Cropped Wool Jacket, Black, 48",
      brand: "Rick Owens",
      category: "Outerwear",
      condition: "Excellent",
      description: "Cropped asymmetric wool jacket, minimal wear.",
      costPrice: 780,
      listPrice: 1350,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "Supreme Box Logo Hoodie, Red, L (FW22)",
      brand: "Supreme",
      category: "Hoodies",
      condition: "Excellent",
      description: "Deadstock condition, tags attached, FW22 drop.",
      costPrice: 420,
      listPrice: 795,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.AUTHENTICATED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "Supreme x The North Face Backpack, Black",
      brand: "Supreme",
      category: "Bags",
      condition: "Excellent",
      description: "Collab backpack, lightly used, all straps intact.",
      costPrice: 190,
      listPrice: 360,
      status: ItemStatus.SOLD,
      soldPrice: 340,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "Louis Vuitton Keepall 50 Bandouliere, Monogram",
      brand: "Louis Vuitton",
      category: "Bags",
      condition: "Good",
      description: "Classic monogram duffel, patina on handles, strap included.",
      costPrice: 950,
      listPrice: 1650,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
    {
      title: "Gucci GG Marmont Belt, Black, 90cm",
      brand: "Gucci",
      category: "Belts",
      condition: "Excellent",
      description: "Black leather belt with double-G buckle, barely worn.",
      costPrice: 210,
      listPrice: 395,
      status: ItemStatus.IN_STOCK,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.PURCHASED,
    },
    {
      title: "CH Cross Beanie, Black",
      brand: "Chrome Hearts",
      category: "Hats",
      condition: "Excellent",
      description: "Ribbed knit beanie, embroidered cross logo on cuff.",
      costPrice: 95,
      listPrice: 185,
      status: ItemStatus.PENDING_INTAKE,
      authenticityStatus: AuthenticityStatus.UNVERIFIED,
      source: ItemSource.CONSIGNED,
    },
  ];

  const createdItems: Awaited<ReturnType<typeof prisma.item.create>>[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const item = await prisma.item.create({
      data: {
        title: it.title,
        brand: it.brand,
        category: it.category,
        condition: it.condition,
        description: it.description,
        costPrice: it.costPrice,
        listPrice: it.listPrice,
        soldPrice: it.soldPrice ?? null,
        status: it.status,
        authenticityStatus: it.authenticityStatus,
        source: it.source,
        photos: {
          create: [
            { dataUrl: solidColorDataUrl(colorForIndex(i)) },
            { dataUrl: solidColorDataUrl(colorForIndex(i + 3)) },
          ],
        },
      },
    });
    createdItems.push(item);
  }

  console.log(`Created ${createdItems.length} inventory items.`);

  // --- Authenticity checks (demo audit trail for a handful of items) ---
  // Most seeded items stay UNVERIFIED, same as real new inventory would —
  // these are the ones that have actually been run through the checklist.
  function itemByTitle(title: string) {
    const item = createdItems.find((i) => i.title === title);
    if (!item) throw new Error(`Seed authenticity check: no item found titled "${title}"`);
    return item;
  }

  function buildChecklist(
    brand: string,
    overrides: Record<string, { checked: boolean; note?: string }> = {}
  ) {
    return getChecklistTemplate(brand).map((t) => ({
      id: t.id,
      label: t.label,
      checked: overrides[t.id]?.checked ?? true,
      note: overrides[t.id]?.note,
    }));
  }

  const authenticatedDemoItems: { title: string; notes: string }[] = [
    { title: "Classic Cross Ring, Silver, Size 10", notes: "Hallmark, engraving, and weight all check out against reference pieces." },
    { title: "CH Cross Patch Hoodie, Black, L", notes: "Tag font, stitching, and hardware all consistent with authentic production." },
    { title: "CH Leather Cross Wallet, Black", notes: "Hardware finish and woven CH tag match reference pieces." },
    { title: "Rick Owens DRKSHDW Ramones High-Top, 43", notes: "Label and stitching consistent with an authentic pair kept for comparison." },
    { title: "Supreme Box Logo Hoodie, Red, L (FW22)", notes: "Box logo proportions match the FW22 release; no receipt provided but tag details check out." },
  ];

  for (const demo of authenticatedDemoItems) {
    const item = itemByTitle(demo.title);
    await prisma.authenticityCheck.create({
      data: {
        itemId: item.id,
        brand: item.brand,
        checklist: JSON.stringify(buildChecklist(item.brand)),
        decision: AuthenticityStatus.AUTHENTICATED,
        notes: demo.notes,
        reviewedById: admin.id,
      },
    });
  }

  const flaggedItem = itemByTitle("CH Cauterize Sunglasses, Tortoise");
  await prisma.authenticityCheck.create({
    data: {
      itemId: flaggedItem.id,
      brand: flaggedItem.brand,
      checklist: JSON.stringify(
        buildChecklist(flaggedItem.brand, {
          "ch-font": { checked: false, note: "Cross lettering on the temple reads thinner/rounder than our reference — off." },
          "ch-hardware": { checked: false, note: "Hardware feels lighter than expected for solid sterling." },
          "generic-red-flags": { checked: false, note: "No case included; seller couldn't provide any purchase history." },
        })
      ),
      decision: AuthenticityStatus.FLAGGED,
      notes: "Two independent red flags on the hardware — holding, not listing, until we get a second opinion.",
      reviewedById: admin.id,
    },
  });

  console.log("Created 6 authenticity check records (5 authenticated, 1 flagged).");

  // --- Sell submissions ---
  const submittedSub = await prisma.sellSubmission.create({
    data: {
      clientId: clients[0].id,
      brand: "Chrome Hearts",
      category: "Rings",
      title: "CH Tiny E Ring, Size 8",
      description: "Bought in 2021, worn occasionally, comes with original box.",
      askingPrice: 500,
      status: SubmissionStatus.SUBMITTED,
      photos: { create: [{ dataUrl: solidColorDataUrl(colorForIndex(1)) }] },
    },
  });

  const offerSub = await prisma.sellSubmission.create({
    data: {
      clientId: clients[1].id,
      brand: "Chrome Hearts",
      category: "Hoodies",
      title: "CH Cross Patch Hoodie, Grey, M",
      description: "Great condition, worn maybe 5 times, smoke-free home.",
      askingPrice: 900,
      status: SubmissionStatus.OFFER_MADE,
      offerAmount: 700,
      photos: { create: [{ dataUrl: solidColorDataUrl(colorForIndex(2)) }] },
    },
  });

  const acceptedSub = await prisma.sellSubmission.create({
    data: {
      clientId: clients[2].id,
      brand: "Chrome Hearts",
      category: "Hats",
      title: "CH Cross Beanie, Black",
      description: "Excellent condition beanie, only worn a handful of times.",
      askingPrice: 200,
      status: SubmissionStatus.ACCEPTED,
      offerAmount: 95,
      photos: { create: [{ dataUrl: solidColorDataUrl(colorForIndex(4)) }] },
    },
  });
  // Note: this accepted submission's converted Item is `createdItems[19]`
  // (the "CH Cross Beanie, Black" PENDING_INTAKE item created above) —
  // in the real admin flow, accepting a submission creates this Item via
  // the server action in src/app/admin/submissions/[id]/actions.ts.

  // This submission was authenticated before the offer was accepted, and
  // that check carries over to its converted Item — the same thing
  // convertToInventory() does when you click "Accept & convert to
  // inventory" in the app.
  const beanieChecklist = buildChecklist("Chrome Hearts");
  await prisma.authenticityCheck.create({
    data: {
      sellSubmissionId: acceptedSub.id,
      brand: "Chrome Hearts",
      checklist: JSON.stringify(beanieChecklist),
      decision: AuthenticityStatus.AUTHENTICATED,
      notes: "Checked before the offer was accepted — hallmark, stitching, and cuff embroidery all consistent.",
      reviewedById: admin.id,
    },
  });
  await prisma.sellSubmission.update({
    where: { id: acceptedSub.id },
    data: { authenticityStatus: AuthenticityStatus.AUTHENTICATED },
  });

  const beanieItem = itemByTitle("CH Cross Beanie, Black");
  await prisma.item.update({
    where: { id: beanieItem.id },
    data: { authenticityStatus: AuthenticityStatus.AUTHENTICATED },
  });
  await prisma.authenticityCheck.create({
    data: {
      itemId: beanieItem.id,
      brand: "Chrome Hearts",
      checklist: JSON.stringify(beanieChecklist),
      decision: AuthenticityStatus.AUTHENTICATED,
      notes: "Carried over from the sell-submission review.",
      reviewedById: admin.id,
    },
  });

  // --- Messages on the offer + accepted submissions ---
  await prisma.message.create({
    data: {
      senderId: admin.id,
      body: "Hi Priya — we can offer $700 for the hoodie based on current comps. Let us know if that works!",
      sellSubmissionId: offerSub.id,
    },
  });
  await prisma.message.create({
    data: {
      senderId: clients[1].id,
      body: "Thanks, let me think it over — will confirm by end of week.",
      sellSubmissionId: offerSub.id,
    },
  });
  await prisma.message.create({
    data: {
      senderId: admin.id,
      body: "Accepted your beanie at $95 — payment sent, thanks for consigning with us!",
      sellSubmissionId: acceptedSub.id,
    },
  });

  // --- Orders ---
  const inStock = createdItems.filter((i) => i.status === ItemStatus.IN_STOCK);
  const sold = createdItems.filter((i) => i.status === ItemStatus.SOLD);

  const order1Items = sold.slice(0, 2).length ? sold.slice(0, 2) : inStock.slice(0, 2);
  const subtotal1 = order1Items.reduce((sum, it) => sum + (it.soldPrice ?? it.listPrice), 0);
  const order1 = await prisma.order.create({
    data: {
      buyerId: clients[0].id,
      status: OrderStatus.PAID,
      subtotal: subtotal1,
      total: subtotal1,
      tenderType: TenderType.CARD,
      stripeSessionId: "demo_seed_session_1",
      items: {
        create: order1Items.map((it) => ({
          itemId: it.id,
          priceAtSale: it.soldPrice ?? it.listPrice,
        })),
      },
    },
  });

  const order2Item = inStock[2] ?? createdItems[0];
  const order2 = await prisma.order.create({
    data: {
      buyerId: clients[1].id,
      status: OrderStatus.PAID,
      subtotal: order2Item.listPrice,
      total: order2Item.listPrice,
      tenderType: TenderType.CASH,
      items: { create: [{ itemId: order2Item.id, priceAtSale: order2Item.listPrice }] },
    },
  });

  const order3Item = inStock[3] ?? createdItems[1];
  const order3 = await prisma.order.create({
    data: {
      buyerId: clients[2].id,
      status: OrderStatus.PENDING,
      subtotal: order3Item.listPrice,
      total: order3Item.listPrice,
      tenderType: TenderType.CARD,
      items: { create: [{ itemId: order3Item.id, priceAtSale: order3Item.listPrice }] },
    },
  });

  await prisma.message.create({
    data: {
      senderId: clients[0].id,
      body: "Just wanted to confirm this shipped — thank you!",
      orderId: order1.id,
    },
  });
  await prisma.message.create({
    data: {
      senderId: admin.id,
      body: "Shipped this morning, tracking on the way. Appreciate the order!",
      orderId: order1.id,
    },
  });

  console.log(`Created 3 sell submissions and 3 orders (${order1.id}, ${order2.id}, ${order3.id}).`);
  console.log("\nSeed complete.");
  console.log(`Admin login:  admin@example.com / ${DEMO_PASSWORD}`);
  console.log(`Client login: client1@example.com / ${DEMO_PASSWORD}`);
}

// Only auto-run when invoked as the CLI seed script (`npm run seed`), never
// on a plain import — the temporary /api/internal/seed route imports
// `main` directly and calls it itself under its own secret + try/catch.
if (process.env.SEED_CLI === "1") {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
