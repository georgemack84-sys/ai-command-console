import { NextResponse } from "next/server";
import { activationRecoveryBoundaryRequest, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await activationRecoveryBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await activationRecoveryBoundaryRequest(request)); }
