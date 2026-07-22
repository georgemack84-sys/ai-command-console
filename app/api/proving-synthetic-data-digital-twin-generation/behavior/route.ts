import { NextResponse } from "next/server";
import { behaviorRequest, requireSyntheticGenerationUser } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await behaviorRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await behaviorRequest(request)); }
