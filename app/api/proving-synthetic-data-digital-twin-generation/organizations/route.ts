import { NextResponse } from "next/server";
import { organizationsRequest, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await organizationsRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await organizationsRequest(request)); }
