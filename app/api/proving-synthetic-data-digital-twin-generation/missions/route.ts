import { NextResponse } from "next/server";
import { missionsRequest, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await missionsRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await missionsRequest(request)); }
