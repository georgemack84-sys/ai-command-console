import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(contractResponse()); }
