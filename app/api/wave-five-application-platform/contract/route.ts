import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(contractResponse()); }
