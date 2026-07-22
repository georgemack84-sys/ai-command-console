import { NextResponse } from "next/server";
import { requireTrustFederationStageTwelveUser, verificationRequest } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await verificationRequest()); }
export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await verificationRequest(request)); }
