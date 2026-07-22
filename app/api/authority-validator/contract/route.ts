import { NextResponse } from "next/server";
import { contractResponse, requireAuthorityValidatorUser } from "../core";

export async function GET() { await requireAuthorityValidatorUser(); return NextResponse.json(contractResponse()); }
