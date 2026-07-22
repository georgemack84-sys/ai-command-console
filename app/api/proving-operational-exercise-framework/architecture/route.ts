import { NextResponse } from "next/server";
import { architectureRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await architectureRequest(request)); }
