import { NextResponse } from "next/server";
import { apisRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await apisRequest(request)); }
