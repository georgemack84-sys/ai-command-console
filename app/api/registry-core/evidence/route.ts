import { NextResponse } from "next/server";
import { evidenceRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await evidenceRequest(request)); }
