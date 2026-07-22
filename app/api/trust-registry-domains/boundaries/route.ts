import { NextResponse } from "next/server";
import { boundariesRequest, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(await boundariesRequest()); }
export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await boundariesRequest(request)); }
