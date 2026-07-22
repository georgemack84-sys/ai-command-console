import { NextResponse } from "next/server";
import { requireAuthorityValidatorUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireAuthorityValidatorUser(); return NextResponse.json(await validateRequest(request)); }
