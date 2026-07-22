import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixPersonalOperationalContextUser } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(contractResponse()); }
