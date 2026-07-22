import { NextResponse } from "next/server";
import { activationManagerRequest, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await activationManagerRequest()); }
export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await activationManagerRequest(request)); }
