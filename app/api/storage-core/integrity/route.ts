import { NextResponse } from "next/server";
import { integrityRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await integrityRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await integrityRequest(request)); }
