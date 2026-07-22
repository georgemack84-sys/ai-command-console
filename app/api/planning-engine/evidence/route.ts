import { NextResponse } from "next/server";
import { evidenceRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await evidenceRequest(request)); }
