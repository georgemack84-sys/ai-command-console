import { NextResponse } from "next/server";
import { metadataRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await metadataRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await metadataRequest(request)); }
