import { NextResponse } from "next/server";
import { requireCafConstitutionalFoundationUser, vocabularyRequest } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await vocabularyRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await vocabularyRequest(request)); }
