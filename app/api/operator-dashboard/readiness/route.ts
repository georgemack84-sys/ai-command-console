import { NextResponse } from "next/server";
import { readinessRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await readinessRequest(request)); }
