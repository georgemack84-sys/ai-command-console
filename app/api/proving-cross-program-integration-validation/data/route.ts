import { NextResponse } from "next/server";
import { dataRequest, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await dataRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await dataRequest(request)); }
