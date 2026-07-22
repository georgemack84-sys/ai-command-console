import { NextResponse } from "next/server";
import { contractResponse, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(contractResponse()); }
