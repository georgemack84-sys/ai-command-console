import { NextResponse } from "next/server";
import { kpisRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await kpisRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await kpisRequest(request)); }
