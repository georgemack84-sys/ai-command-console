import { NextResponse } from "next/server";
import { requireWaveSixDependencyServiceCoordinationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixDependencyServiceCoordinationUser(); return NextResponse.json(await validateRequest(request)); }
