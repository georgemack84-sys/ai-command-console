import { NextResponse } from "next/server";
import { executionRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await executionRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await executionRequest(request)); }
