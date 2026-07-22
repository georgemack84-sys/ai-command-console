import { NextResponse } from "next/server";
import { constraintsRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await constraintsRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await constraintsRequest(request)); }
