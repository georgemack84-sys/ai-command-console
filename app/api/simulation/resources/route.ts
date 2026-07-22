import { NextResponse } from "next/server";
import { requireSimulationUser, resourcesRequest } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await resourcesRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await resourcesRequest(request)); }
