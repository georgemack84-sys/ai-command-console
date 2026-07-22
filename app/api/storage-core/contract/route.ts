import { NextResponse } from "next/server";
import { contractResponse, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(contractResponse()); }
