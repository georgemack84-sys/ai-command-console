import { NextResponse } from "next/server";
import { cataAvailabilityRequest, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await cataAvailabilityRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await cataAvailabilityRequest(request)); }
