import { NextResponse } from "next/server";
import { requireCafConstitutionalFoundationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await validateRequest(request)); }
