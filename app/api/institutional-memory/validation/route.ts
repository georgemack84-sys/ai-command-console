import { NextResponse } from "next/server";
import { requireInstitutionalMemoryUser, validationRequest } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await validationRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await validationRequest(request)); }
