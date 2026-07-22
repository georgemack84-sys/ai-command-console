import { NextResponse } from "next/server";
import { architectureRequest, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await architectureRequest(request)); }
