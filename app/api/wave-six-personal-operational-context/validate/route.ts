import { NextResponse } from "next/server";
import { requireWaveSixPersonalOperationalContextUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await validateRequest(request)); }
