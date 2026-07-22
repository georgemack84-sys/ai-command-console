import { NextResponse } from "next/server";
import { foundationRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await foundationRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await foundationRequest(request)); }
