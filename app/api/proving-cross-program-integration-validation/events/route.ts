import { NextResponse } from "next/server";
import { eventsRequest, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await eventsRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await eventsRequest(request)); }
