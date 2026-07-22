import { NextResponse } from "next/server";
import { distributedRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await distributedRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await distributedRequest(request)); }
