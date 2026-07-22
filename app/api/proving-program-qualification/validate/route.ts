import { NextResponse } from "next/server";
import { requireProgramQualificationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await validateRequest(request)); }
