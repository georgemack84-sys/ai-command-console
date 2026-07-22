import { NextResponse } from "next/server";
import { requireTrustProgramQualificationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireTrustProgramQualificationUser(); return NextResponse.json(await validateRequest(request)); }
