import { NextResponse } from "next/server";
import { explorerRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await explorerRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await explorerRequest(request)); }
