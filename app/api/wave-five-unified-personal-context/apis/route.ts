import { NextResponse } from "next/server";
import { apisRequest, requireWaveFiveUnifiedPersonalContextUser } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await apisRequest(request)); }
