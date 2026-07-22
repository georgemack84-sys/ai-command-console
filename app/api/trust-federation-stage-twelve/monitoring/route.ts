import { NextResponse } from "next/server";
import { monitoringRequest, requireTrustFederationStageTwelveUser } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await monitoringRequest()); }
export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await monitoringRequest(request)); }
