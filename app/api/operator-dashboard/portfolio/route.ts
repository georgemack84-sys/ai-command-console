import { NextResponse } from "next/server";
import { portfolioRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await portfolioRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await portfolioRequest(request)); }
