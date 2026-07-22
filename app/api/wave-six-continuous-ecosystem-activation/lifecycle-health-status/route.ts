import { NextResponse } from "next/server";
import { lifecycleHealthStatusRequest, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await lifecycleHealthStatusRequest()); }
export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await lifecycleHealthStatusRequest(request)); }
