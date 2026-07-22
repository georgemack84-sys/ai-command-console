import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(contractResponse()); }
