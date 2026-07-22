import { NextResponse } from "next/server";
import { contractResponse, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(contractResponse()); }
