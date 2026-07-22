import { NextResponse } from "next/server";
import { dashboardRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await dashboardRequest(request)); }
