import { NextResponse } from "next/server";
import { requireStorageFullUser, searchRequest } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await searchRequest(request)); }
