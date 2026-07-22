import { NextResponse } from "next/server";
import { goalRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await goalRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await goalRequest(request)); }
