import { NextResponse } from "next/server";
import { contractResponse, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(contractResponse()); }
