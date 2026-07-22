import { NextResponse } from "next/server";
import { backupRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await backupRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await backupRequest(request)); }
