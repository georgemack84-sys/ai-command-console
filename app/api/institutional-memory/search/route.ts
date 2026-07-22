import { NextResponse } from "next/server";
import { requireInstitutionalMemoryUser, searchRequest } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await searchRequest(request)); }
