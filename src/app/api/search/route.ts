import { NextRequest, NextResponse } from "next/server";
import { search } from "@/domain/echo/pipeline";
import { guardInput, limit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let title: string, body: string;
  try {
    ({ title = "", body = "" } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if ((title + body).trim().length < 10) {
    return NextResponse.json({ error: "describe the issue (min 10 chars)" }, { status: 400 });
  }

  // Demo guards (no-op locally): cap input size, rate-limit per IP.
  const tooBig = guardInput(title + body);
  if (tooBig) return NextResponse.json({ error: tooBig }, { status: 413 });
  const limited = await limit(clientIp(req));
  if (limited) return NextResponse.json({ error: limited }, { status: 429 });

  try {
    const result = await search(title, body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("search failed", err);
    return NextResponse.json({ error: "search failed — check server env" }, { status: 500 });
  }
}
