import { NextResponse } from "next/server";
import { registryRequest, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await registryRequest(request)); }
