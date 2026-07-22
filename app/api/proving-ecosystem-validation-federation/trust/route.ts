import { NextResponse } from "next/server";
import { requireFederationUser, trustRequest } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await trustRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await trustRequest(request)); }
