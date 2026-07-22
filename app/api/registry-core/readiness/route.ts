import { NextResponse } from "next/server";
import { readinessRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await readinessRequest(request)); }
