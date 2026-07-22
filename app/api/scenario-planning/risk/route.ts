import { NextResponse } from "next/server";
import { requireScenarioPlanningUser, riskRequest } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await riskRequest(request)); }
