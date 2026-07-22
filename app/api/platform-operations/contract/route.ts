import { NextResponse } from "next/server";
import { contractResponse, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(contractResponse()); }
