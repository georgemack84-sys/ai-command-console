import { NextResponse } from "next/server";
import { requireOperatorDashboardUser, searchRequest } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await searchRequest(request)); }
