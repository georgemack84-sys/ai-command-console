import { NextResponse } from "next/server";
import { dependenciesRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await dependenciesRequest(request)); }
