import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(contractResponse()); }
