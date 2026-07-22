import { NextResponse } from "next/server";
import { contractResponse, requireRegistryCoreUser } from "../core";
export async function GET() { await requireRegistryCoreUser(); return NextResponse.json(contractResponse()); }
