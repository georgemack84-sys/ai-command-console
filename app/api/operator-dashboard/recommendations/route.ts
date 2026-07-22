import { NextResponse } from "next/server";
import { recommendationsRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await recommendationsRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await recommendationsRequest(request)); }
