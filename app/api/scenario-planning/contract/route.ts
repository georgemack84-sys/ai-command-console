import { NextResponse } from "next/server";
import { contractResponse, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(contractResponse()); }
