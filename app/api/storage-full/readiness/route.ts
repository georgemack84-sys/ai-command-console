import { NextResponse } from "next/server";
import { readinessRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await readinessRequest(request)); }
