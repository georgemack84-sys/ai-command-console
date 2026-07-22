import { NextResponse } from "next/server";
import { registryRequest, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await registryRequest(request)); }
