import { NextResponse } from "next/server";
import { contextManagerRequest, requireWaveSixPersonalOperationalContextUser } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await contextManagerRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await contextManagerRequest(request)); }
