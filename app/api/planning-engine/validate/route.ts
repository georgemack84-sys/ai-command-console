import { NextResponse } from "next/server";
import { requirePlanningEngineUser, validateRequest } from "../core";

export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await validateRequest(request)); }
