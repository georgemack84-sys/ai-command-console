import { NextResponse } from "next/server";
import { architectureRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await architectureRequest(request)); }
