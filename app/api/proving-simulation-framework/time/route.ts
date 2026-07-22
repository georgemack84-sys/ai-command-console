import { NextResponse } from "next/server";
import { requireSimulationFrameworkUser, timeRequest } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await timeRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await timeRequest(request)); }
