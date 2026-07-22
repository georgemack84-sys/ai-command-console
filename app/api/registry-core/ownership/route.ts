import { NextResponse } from "next/server";
import { ownershipRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await ownershipRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await ownershipRequest(request)); }
