import { NextResponse } from "next/server";
import { metricsRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await metricsRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await metricsRequest(request)); }
