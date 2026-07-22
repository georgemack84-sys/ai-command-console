import { NextResponse } from "next/server";
import { requireSyntheticGenerationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await validateRequest(request)); }
