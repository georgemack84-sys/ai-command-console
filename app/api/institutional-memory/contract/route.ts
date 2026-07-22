import { NextResponse } from "next/server";
import { contractResponse, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(contractResponse()); }
