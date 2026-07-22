import { NextResponse } from "next/server";
import { requireWaveFiveUnifiedPersonalContextUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await validateRequest(request)); }
