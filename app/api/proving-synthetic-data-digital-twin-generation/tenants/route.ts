import { NextResponse } from "next/server";
import { requireSyntheticGenerationUser, tenantsRequest } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await tenantsRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await tenantsRequest(request)); }
