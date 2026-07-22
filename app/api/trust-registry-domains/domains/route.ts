import { NextResponse } from "next/server";
import { domainsRequest, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(await domainsRequest()); }
export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await domainsRequest(request)); }
