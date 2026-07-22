import { NextResponse } from "next/server";
import { definitionRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await definitionRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await definitionRequest(request)); }
