import { NextResponse } from "next/server";
import { requireScenarioPlanningUser, whatIfRequest } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await whatIfRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await whatIfRequest(request)); }
