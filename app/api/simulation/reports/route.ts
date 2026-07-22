import { NextResponse } from "next/server";
import { reportsRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await reportsRequest(request)); }
