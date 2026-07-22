import { NextResponse } from "next/server";
import { infrastructureRequest, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await infrastructureRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await infrastructureRequest(request)); }
