import { NextResponse } from "next/server";
import { queryRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await queryRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await queryRequest(request)); }
