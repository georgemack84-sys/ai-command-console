import { NextResponse } from "next/server";
import { requireWaveSixContinuousEcosystemActivationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await validateRequest(request)); }
