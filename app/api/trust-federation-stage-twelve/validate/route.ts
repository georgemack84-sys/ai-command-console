import { NextResponse } from "next/server";
import { requireTrustFederationStageTwelveUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustFederationStageTwelveUser(); return NextResponse.json(await validateRequest(request)); }
