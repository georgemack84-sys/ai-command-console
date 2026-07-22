import { NextResponse } from "next/server";
import { requirePlanningEngineUser, validationEngineRequest } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await validationEngineRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await validationEngineRequest(request)); }
