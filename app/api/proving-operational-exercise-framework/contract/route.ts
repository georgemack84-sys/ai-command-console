import { NextResponse } from "next/server";
import { contractResponse, requireOperationalExerciseUser } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(contractResponse()); }
