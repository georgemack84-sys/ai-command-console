import { NextResponse } from "next/server";
import { reportsRequest, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await reportsRequest(request)); }
