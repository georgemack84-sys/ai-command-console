import { NextResponse } from "next/server";
import { composeRequest, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await composeRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await composeRequest(request)); }
