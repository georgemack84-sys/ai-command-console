import { NextResponse } from "next/server";
import { requireOperatorDashboardUser, visualizationRequest } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await visualizationRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await visualizationRequest(request)); }
