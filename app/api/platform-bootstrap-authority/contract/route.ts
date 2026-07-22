import { NextResponse } from "next/server";
import { contractResponse, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(contractResponse()); }
