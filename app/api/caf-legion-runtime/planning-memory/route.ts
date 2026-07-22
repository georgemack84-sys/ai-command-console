import { NextResponse } from "next/server";
import { planningMemoryRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await planningMemoryRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await planningMemoryRequest(request)); }
