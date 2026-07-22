import { NextResponse } from "next/server";
import { contractResponse, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(contractResponse()); }
