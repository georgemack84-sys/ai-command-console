import { NextResponse } from "next/server";
import { governanceRequest, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await governanceRequest(request)); }
