import { NextResponse } from "next/server";
import { governanceRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await governanceRequest(request)); }
