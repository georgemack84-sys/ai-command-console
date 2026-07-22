import { NextResponse } from "next/server";
import { architectureRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await architectureRequest(request)); }
