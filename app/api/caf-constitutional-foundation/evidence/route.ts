import { NextResponse } from "next/server";
import { evidenceRequest, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await evidenceRequest(request)); }
