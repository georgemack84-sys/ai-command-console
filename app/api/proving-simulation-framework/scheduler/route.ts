import { NextResponse } from "next/server";
import { requireSimulationFrameworkUser, schedulerRequest } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(await schedulerRequest()); }
export async function POST(request: Request) { await requireSimulationFrameworkUser(); return NextResponse.json(await schedulerRequest(request)); }
