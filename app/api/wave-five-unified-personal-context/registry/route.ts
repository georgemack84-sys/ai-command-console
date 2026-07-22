import { NextResponse } from "next/server";
import { registryRequest, requireWaveFiveUnifiedPersonalContextUser } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await registryRequest(request)); }
