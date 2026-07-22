import { NextResponse } from "next/server";
import { contractResponse, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(contractResponse()); }
