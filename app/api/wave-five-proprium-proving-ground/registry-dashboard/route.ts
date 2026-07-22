import { NextResponse } from "next/server";
import { registryDashboardRequest, requireWaveFiveProvingGroundUser } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await registryDashboardRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await registryDashboardRequest(request)); }
