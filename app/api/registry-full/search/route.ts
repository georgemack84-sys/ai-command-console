import { NextResponse } from "next/server";
import { requireRegistryFullUser, searchRequest } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await searchRequest(request)); }
