import { NextResponse } from "next/server";
import { relationshipsRequest, requireTrustRegistryDomainsUser } from "../core";

export async function GET() { await requireTrustRegistryDomainsUser(); return NextResponse.json(await relationshipsRequest()); }
export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await relationshipsRequest(request)); }
