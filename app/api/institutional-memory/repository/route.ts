import { NextResponse } from "next/server";
import { repositoryRequest, requireInstitutionalMemoryUser } from "../core";

export async function GET() { await requireInstitutionalMemoryUser(); return NextResponse.json(await repositoryRequest()); }
export async function POST(request: Request) { await requireInstitutionalMemoryUser(); return NextResponse.json(await repositoryRequest(request)); }
