import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveHealthUser } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(contractResponse()); }
