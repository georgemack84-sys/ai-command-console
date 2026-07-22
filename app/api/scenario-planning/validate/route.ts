import { NextResponse } from "next/server";
import { requireScenarioPlanningUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await validateRequest(request)); }
