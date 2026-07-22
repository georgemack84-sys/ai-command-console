import { NextResponse } from "next/server";
import { graphRequest, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await graphRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await graphRequest(request)); }
