import { NextResponse } from "next/server";
import { comparisonRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await comparisonRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await comparisonRequest(request)); }
