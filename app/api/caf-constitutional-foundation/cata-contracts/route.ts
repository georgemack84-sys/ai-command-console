import { NextResponse } from "next/server";
import { cataContractsRequest, requireCafConstitutionalFoundationUser } from "../core";
export async function GET() { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await cataContractsRequest()); }
export async function POST(request: Request) { await requireCafConstitutionalFoundationUser(); return NextResponse.json(await cataContractsRequest(request)); }
