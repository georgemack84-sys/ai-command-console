import { NextResponse } from "next/server";
import { learningRequest, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await learningRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await learningRequest(request)); }
