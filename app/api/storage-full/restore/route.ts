import { NextResponse } from "next/server";
import { requireStorageFullUser, restoreRequest } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await restoreRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await restoreRequest(request)); }
