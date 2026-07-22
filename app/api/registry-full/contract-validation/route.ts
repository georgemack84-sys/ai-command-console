import { NextResponse } from "next/server";
import { contractValidationRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await contractValidationRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await contractValidationRequest(request)); }
