import { NextResponse } from "next/server";
import { namespacesRequest, requireIdentityCoreUser } from "../core";
export async function GET() { await requireIdentityCoreUser(); return NextResponse.json(await namespacesRequest()); }
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await namespacesRequest(request)); }
