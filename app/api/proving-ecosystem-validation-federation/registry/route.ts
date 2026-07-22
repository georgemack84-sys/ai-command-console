import { NextResponse } from "next/server";
import { registryRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await registryRequest(request)); }
