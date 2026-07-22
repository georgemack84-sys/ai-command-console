import { NextResponse } from "next/server";
import { outputsRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await outputsRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await outputsRequest(request)); }
