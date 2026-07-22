import { NextResponse } from "next/server";
import { reportingRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await reportingRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await reportingRequest(request)); }
