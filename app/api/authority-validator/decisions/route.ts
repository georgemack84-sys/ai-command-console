import { NextResponse } from "next/server";
import { decisionsRequest, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await decisionsRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await decisionsRequest(request)); }
