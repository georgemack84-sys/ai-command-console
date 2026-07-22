import { NextResponse } from "next/server";
import { domainsRequest, requireProgramQualificationUser } from "../core";
export async function GET() { await requireProgramQualificationUser(); return NextResponse.json(await domainsRequest()); }
export async function POST(request: Request) { await requireProgramQualificationUser(); return NextResponse.json(await domainsRequest(request)); }
