import { NextResponse } from "next/server";
import { assumptionsRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await assumptionsRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await assumptionsRequest(request)); }
