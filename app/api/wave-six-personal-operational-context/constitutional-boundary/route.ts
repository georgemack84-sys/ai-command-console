import { NextResponse } from "next/server";
import { constitutionalBoundaryRequest, requireWaveSixPersonalOperationalContextUser } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await constitutionalBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await constitutionalBoundaryRequest(request)); }
