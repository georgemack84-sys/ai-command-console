import { NextResponse } from "next/server";
import { requireCafLegionRuntimeUser, runtimeRequest } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await runtimeRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await runtimeRequest(request)); }
