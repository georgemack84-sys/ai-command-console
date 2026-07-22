import { NextResponse } from "next/server";
import { contractResponse, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(contractResponse()); }
