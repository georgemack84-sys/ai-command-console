import { NextResponse } from "next/server";
import { lineageRequest, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await lineageRequest(request)); }
