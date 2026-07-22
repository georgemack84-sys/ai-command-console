import { NextResponse } from "next/server";
import { governanceExerciseRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await governanceExerciseRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await governanceExerciseRequest(request)); }
