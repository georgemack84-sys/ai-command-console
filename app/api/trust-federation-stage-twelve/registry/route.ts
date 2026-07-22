import { NextResponse } from "next/server";
import { registryRequest, requireTrustFederationStageTwelveUser } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await registryRequest(request)); }
