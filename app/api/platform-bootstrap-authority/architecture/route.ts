import { NextResponse } from "next/server";
import { architectureRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await architectureRequest(request)); }
