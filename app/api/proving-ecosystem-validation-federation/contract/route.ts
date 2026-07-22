import { NextResponse } from "next/server";
import { contractResponse, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(contractResponse()); }
