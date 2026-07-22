import { NextResponse } from "next/server";
import { finalReportRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await finalReportRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await finalReportRequest(request)); }
