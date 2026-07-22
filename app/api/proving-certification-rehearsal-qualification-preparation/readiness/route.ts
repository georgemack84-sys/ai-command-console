import { NextResponse } from "next/server";
import { readinessRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await readinessRequest(request)); }
