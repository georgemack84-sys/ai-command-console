import { NextResponse } from "next/server";
import { requireMissionRecommendationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await validateRequest(request)); }
