import { NextResponse } from "next/server";
import { requireWaveFiveProvingGroundUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await validateRequest(request)); }
