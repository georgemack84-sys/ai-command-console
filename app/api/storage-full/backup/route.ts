import { NextResponse } from "next/server";
import { backupRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await backupRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await backupRequest(request)); }
