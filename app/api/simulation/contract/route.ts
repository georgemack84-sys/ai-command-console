import { NextResponse } from "next/server";
import { contractResponse, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(contractResponse()); }
