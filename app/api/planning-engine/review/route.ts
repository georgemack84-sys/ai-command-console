import { NextResponse } from "next/server";
import { requirePlanningEngineUser, reviewRequest } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await reviewRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await reviewRequest(request)); }
