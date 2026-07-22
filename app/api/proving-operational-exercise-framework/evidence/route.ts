import { NextResponse } from "next/server";
import { evidenceRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await evidenceRequest(request)); }
