import { NextResponse } from "next/server";
import { operatorRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await operatorRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await operatorRequest(request)); }
