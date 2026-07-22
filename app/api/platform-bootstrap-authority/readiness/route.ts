import { NextResponse } from "next/server";
import { readinessRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await readinessRequest(request)); }
