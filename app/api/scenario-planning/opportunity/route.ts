import { NextResponse } from "next/server";
import { opportunityRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await opportunityRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await opportunityRequest(request)); }
