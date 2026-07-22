import { NextResponse } from "next/server";
import { boundaryRequest, requireTrustFederationStageTwelveUser } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await boundaryRequest()); }
export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await boundaryRequest(request)); }
