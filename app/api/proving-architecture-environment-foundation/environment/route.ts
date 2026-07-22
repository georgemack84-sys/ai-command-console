import { NextResponse } from "next/server";
import { environmentRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await environmentRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await environmentRequest(request)); }
