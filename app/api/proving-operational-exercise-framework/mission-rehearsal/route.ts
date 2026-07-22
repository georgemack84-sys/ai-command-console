import { NextResponse } from "next/server";
import { missionRehearsalRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await missionRehearsalRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await missionRehearsalRequest(request)); }
