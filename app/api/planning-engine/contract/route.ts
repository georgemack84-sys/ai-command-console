import { NextResponse } from "next/server";
import { contractResponse, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(contractResponse()); }
