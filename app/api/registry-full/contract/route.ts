import { NextResponse } from "next/server";
import { contractResponse, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(contractResponse()); }
