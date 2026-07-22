import { NextResponse } from "next/server";
import { collaborationDelegationRequest, requireCafLegionRuntimeUser } from "../core";
export async function GET() { await requireCafLegionRuntimeUser(); return NextResponse.json(await collaborationDelegationRequest()); }
export async function POST(request: Request) { await requireCafLegionRuntimeUser(); return NextResponse.json(await collaborationDelegationRequest(request)); }
