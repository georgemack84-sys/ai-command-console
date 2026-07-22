import { NextResponse } from "next/server";
import { operationalRequest, requireRehearsalPreparationUser } from "../core";
export async function GET() { await requireRehearsalPreparationUser(); return NextResponse.json(await operationalRequest()); }
export async function POST(request: Request) { await requireRehearsalPreparationUser(); return NextResponse.json(await operationalRequest(request)); }
