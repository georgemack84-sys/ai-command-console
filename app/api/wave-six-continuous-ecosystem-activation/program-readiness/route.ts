import { NextResponse } from "next/server";
import { programReadinessRequest, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await programReadinessRequest()); }
export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await programReadinessRequest(request)); }
