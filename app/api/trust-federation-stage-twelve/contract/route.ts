import { NextResponse } from "next/server";
import { contractResponse, requireTrustFederationStageTwelveUser } from "../core";

export async function GET() { await requireTrustFederationStageTwelveUser(); return NextResponse.json(contractResponse()); }
