import { NextResponse } from "next/server";
import { approvalsRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await approvalsRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await approvalsRequest(request)); }
