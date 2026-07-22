import { NextResponse } from "next/server";
import { eventsRequest, requireStorageFullUser } from "../core";
export async function GET() { await requireStorageFullUser(); return NextResponse.json(await eventsRequest()); }
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await eventsRequest(request)); }
