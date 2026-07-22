import { NextResponse } from "next/server";
import { filtersRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await filtersRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await filtersRequest(request)); }
