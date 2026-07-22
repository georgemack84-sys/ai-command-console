import { NextResponse } from "next/server";
import { contractResponse, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(contractResponse()); }
