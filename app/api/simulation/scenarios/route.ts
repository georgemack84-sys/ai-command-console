import { NextResponse } from "next/server";
import { requireSimulationUser, scenariosRequest } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await scenariosRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await scenariosRequest(request)); }
