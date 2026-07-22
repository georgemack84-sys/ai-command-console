import { NextResponse } from "next/server";
import { objectsRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await objectsRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await objectsRequest(request)); }
