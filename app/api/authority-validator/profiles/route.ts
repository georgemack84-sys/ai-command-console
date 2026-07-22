import { NextResponse } from "next/server";
import { profilesRequest, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await profilesRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await profilesRequest(request)); }
