import { NextResponse } from "next/server";
import { dispositionMappingRequest, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await dispositionMappingRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await dispositionMappingRequest(request)); }
