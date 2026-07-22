import { NextResponse } from "next/server";
import { evidenceRequest, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await evidenceRequest(request)); }
