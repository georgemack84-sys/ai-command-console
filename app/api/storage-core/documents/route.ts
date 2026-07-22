import { NextResponse } from "next/server";
import { documentsRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await documentsRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await documentsRequest(request)); }
