import { NextResponse } from "next/server";
import { requireCafConstitutionalFoundationUser, tenantIntegrationRequest } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await tenantIntegrationRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await tenantIntegrationRequest(request)); }
