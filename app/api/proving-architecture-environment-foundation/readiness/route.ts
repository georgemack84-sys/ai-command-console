import { NextResponse } from "next/server";
import { readinessRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await readinessRequest(request)); }
