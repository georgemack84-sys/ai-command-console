import { NextResponse } from "next/server";
import { requireStorageFullUser, retentionRequest } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await retentionRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await retentionRequest(request)); }
