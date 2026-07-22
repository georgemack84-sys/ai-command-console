import { NextResponse } from "next/server";
import { architectureRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await architectureRequest(request)); }
