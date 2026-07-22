import { NextResponse } from "next/server";
import { requireOperatorDashboardUser, securityRequest } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await securityRequest(request)); }
