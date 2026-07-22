import { NextResponse } from "next/server";
import { requireWaveFiveApexUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await validateRequest(request)); }
