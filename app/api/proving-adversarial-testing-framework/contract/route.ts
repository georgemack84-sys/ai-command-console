import { NextResponse } from "next/server";
import { contractResponse, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(contractResponse()); }
