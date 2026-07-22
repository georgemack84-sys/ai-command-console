import { NextResponse } from "next/server";
import { evaluationRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await evaluationRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await evaluationRequest(request)); }
