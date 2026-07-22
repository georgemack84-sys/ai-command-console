import { NextResponse } from "next/server";
import { matrixRequest, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await matrixRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await matrixRequest(request)); }
