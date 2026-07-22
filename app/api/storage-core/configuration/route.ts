import { NextResponse } from "next/server";
import { configurationRequest, requireStorageCoreUser } from "../core";
export async function GET() { await requireStorageCoreUser(); return NextResponse.json(await configurationRequest()); }
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await configurationRequest(request)); }
