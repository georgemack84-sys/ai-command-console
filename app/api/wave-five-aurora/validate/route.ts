import { NextResponse } from "next/server";
import { requireWaveFiveAuroraUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await validateRequest(request)); }
