import { NextResponse } from "next/server";
import { operatorDrillRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await operatorDrillRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await operatorDrillRequest(request)); }
