import { NextResponse } from "next/server";
import { requireTrustRegistryDomainsUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustRegistryDomainsUser(); return NextResponse.json(await validateRequest(request)); }
