import { NextResponse } from "next/server";
import { registrationRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await registrationRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await registrationRequest(request)); }
