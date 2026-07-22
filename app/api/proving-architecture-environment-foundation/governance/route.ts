import { NextResponse } from "next/server";
import { governanceRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await governanceRequest(request)); }
