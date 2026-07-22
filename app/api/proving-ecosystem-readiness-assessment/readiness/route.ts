import { NextResponse } from "next/server";
import { readinessRequest, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await readinessRequest(request)); }
