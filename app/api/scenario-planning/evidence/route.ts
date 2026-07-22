import { NextResponse } from "next/server";
import { evidenceRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await evidenceRequest(request)); }
