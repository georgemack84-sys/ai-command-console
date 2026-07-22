import { NextResponse } from "next/server";
import { readinessRequest, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await readinessRequest(request)); }
