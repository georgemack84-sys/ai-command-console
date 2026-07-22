import { NextResponse } from "next/server";
import { contractResponse, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(contractResponse()); }
