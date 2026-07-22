import { NextResponse } from "next/server";
import { executionRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await executionRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await executionRequest(request)); }
