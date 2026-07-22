import { NextResponse } from "next/server";
import { requireWaveSixOperationalOptimizationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixOperationalOptimizationUser(); return NextResponse.json(await validateRequest(request)); }
