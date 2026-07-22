import { NextResponse } from "next/server";
import { emergencySimulationRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await emergencySimulationRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await emergencySimulationRequest(request)); }
