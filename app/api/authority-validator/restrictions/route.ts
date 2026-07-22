import { NextResponse } from "next/server";
import { requireAuthorityValidatorUser, restrictionsRequest } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(await restrictionsRequest()); }
export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await restrictionsRequest(request)); }
