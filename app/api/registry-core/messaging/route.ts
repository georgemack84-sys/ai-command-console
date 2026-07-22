import { NextResponse } from "next/server";
import { messagingRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await messagingRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await messagingRequest(request)); }
