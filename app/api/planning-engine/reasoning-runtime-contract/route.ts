import { NextResponse } from "next/server";
import { contractRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await contractRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await contractRequest(request)); }
