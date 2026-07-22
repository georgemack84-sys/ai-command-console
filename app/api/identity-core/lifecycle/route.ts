import { NextResponse } from "next/server";
import { lifecycleRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await lifecycleRequest(request)); }
