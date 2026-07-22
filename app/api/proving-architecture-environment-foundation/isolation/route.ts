import { NextResponse } from "next/server";
import { isolationRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await isolationRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await isolationRequest(request)); }
