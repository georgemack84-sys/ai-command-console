import { NextResponse } from "next/server";
import { governanceRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await governanceRequest(request)); }
