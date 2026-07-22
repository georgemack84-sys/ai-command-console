import { NextResponse } from "next/server";
import { lifecycleRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await lifecycleRequest(request)); }
