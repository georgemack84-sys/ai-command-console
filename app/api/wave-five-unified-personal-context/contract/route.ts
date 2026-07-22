import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveUnifiedPersonalContextUser } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(contractResponse()); }
