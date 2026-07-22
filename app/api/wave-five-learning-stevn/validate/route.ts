import { NextResponse } from "next/server";
import { requireWaveFiveLearningStevnUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await validateRequest(request)); }
