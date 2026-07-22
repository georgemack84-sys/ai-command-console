import { NextResponse } from "next/server";
import { contractResponse, requireSimulationFrameworkUser } from "../core";
export async function GET() { await requireSimulationFrameworkUser(); return NextResponse.json(contractResponse()); }
