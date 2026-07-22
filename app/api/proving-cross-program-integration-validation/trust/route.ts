import { NextResponse } from "next/server";
import { requireCrossProgramIntegrationUser, trustRequest } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await trustRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await trustRequest(request)); }
