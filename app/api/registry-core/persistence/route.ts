import { NextResponse } from "next/server";
import { persistenceRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await persistenceRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await persistenceRequest(request)); }
