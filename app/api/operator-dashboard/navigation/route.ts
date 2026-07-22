import { NextResponse } from "next/server";
import { navigationRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await navigationRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await navigationRequest(request)); }
