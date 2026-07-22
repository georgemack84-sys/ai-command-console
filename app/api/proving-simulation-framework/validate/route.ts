import { NextResponse } from "next/server";
import { requireSimulationFrameworkUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await validateRequest(request)); }
