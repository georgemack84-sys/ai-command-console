import { NextResponse } from "next/server";
import { requireInstitutionalMemoryUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await validateRequest(request)); }
