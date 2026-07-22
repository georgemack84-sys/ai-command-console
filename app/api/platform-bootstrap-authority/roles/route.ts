import { NextResponse } from "next/server";
import { requireBootstrapUser, rolesRequest } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await rolesRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await rolesRequest(request)); }
