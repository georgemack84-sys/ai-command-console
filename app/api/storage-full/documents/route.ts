import { NextResponse } from "next/server";
import { documentsRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await documentsRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await documentsRequest(request)); }
