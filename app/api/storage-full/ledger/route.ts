import { NextResponse } from "next/server";
import { ledgerRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await ledgerRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await ledgerRequest(request)); }
