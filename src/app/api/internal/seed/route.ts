import { NextRequest, NextResponse } from "next/server";
import { main as seedDatabase } from "../../../../../prisma/seed";

// TEMPORARY one-time route used to seed the production database with demo
// data from a context that can actually reach the DB over the public
// internet. Gated by SEED_SECRET so it can't be triggered by anyone who
// doesn't have it. Delete this route (and the SEED_SECRET env var) once
// the seed has run successfully — it should not stay in the deployed app.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || !process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await seedDatabase();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
