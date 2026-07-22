import { NextResponse } from "next/server";
import { registryRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await registryRequest(request)); }
