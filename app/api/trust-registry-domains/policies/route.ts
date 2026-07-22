import { NextResponse } from "next/server";
import { policiesRequest, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(await policiesRequest()); }
export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await policiesRequest(request)); }
