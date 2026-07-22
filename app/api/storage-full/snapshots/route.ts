import { NextResponse } from "next/server";
import { requireStorageFullUser, snapshotsRequest } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await snapshotsRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await snapshotsRequest(request)); }
