import { NextResponse } from "next/server";
import { contractsRequest, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(await contractsRequest()); }
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await contractsRequest(request)); }
