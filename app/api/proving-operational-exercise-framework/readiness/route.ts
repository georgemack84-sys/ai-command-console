import { NextResponse } from "next/server";
import { readinessRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await readinessRequest(request)); }
