import { NextResponse } from "next/server";
import { registryCurriculumRequest, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await registryCurriculumRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await registryCurriculumRequest(request)); }
