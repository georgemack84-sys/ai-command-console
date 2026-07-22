import { NextResponse } from "next/server";
import { evidenceReportRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await evidenceReportRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await evidenceReportRequest(request)); }
