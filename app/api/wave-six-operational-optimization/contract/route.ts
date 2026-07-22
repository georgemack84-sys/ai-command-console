import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixOperationalOptimizationUser } from "../core";

export async function GET() { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(contractResponse()); }
