import { NextResponse } from "next/server";
import { requireWaveFiveHealthUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await validateRequest(request)); }
