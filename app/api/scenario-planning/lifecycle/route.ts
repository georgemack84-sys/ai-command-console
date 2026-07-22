import { NextResponse } from "next/server";
import { lifecycleRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await lifecycleRequest(request)); }
