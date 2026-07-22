import { NextResponse } from "next/server";
import { requireOperationalExerciseUser, tabletopRequest } from "../core";
export async function GET() { await requireOperationalExerciseUser(); return NextResponse.json(await tabletopRequest()); }
export async function POST(request: Request) { await requireOperationalExerciseUser(); return NextResponse.json(await tabletopRequest(request)); }
