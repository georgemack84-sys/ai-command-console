import { NextResponse } from "next/server";
import { requireOperationalExerciseUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await validateRequest(request)); }
