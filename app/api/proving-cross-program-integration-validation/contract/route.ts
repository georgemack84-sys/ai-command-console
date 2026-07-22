import { NextResponse } from "next/server";
import { contractResponse, requireCrossProgramIntegrationUser } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(contractResponse()); }
