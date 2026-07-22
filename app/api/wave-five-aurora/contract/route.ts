import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(contractResponse()); }
