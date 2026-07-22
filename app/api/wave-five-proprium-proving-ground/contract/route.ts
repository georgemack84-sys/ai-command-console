import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveProvingGroundUser } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(contractResponse()); }
