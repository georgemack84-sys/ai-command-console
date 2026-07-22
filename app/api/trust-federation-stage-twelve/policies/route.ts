import { NextResponse } from "next/server";
import { policiesRequest, requireTrustFederationStageTwelveUser } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await policiesRequest()); }
export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await policiesRequest(request)); }
