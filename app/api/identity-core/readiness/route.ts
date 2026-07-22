import { NextResponse } from "next/server";
import { readinessRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await readinessRequest(request)); }
