import { NextResponse } from "next/server";
import { apisRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await apisRequest(request)); }
