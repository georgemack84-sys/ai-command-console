import { NextResponse } from "next/server";
import { digitalTwinRequest, requireOperatorDashboardUser } from "../core";

export async function GET() { await requireOperatorDashboardUser(); return NextResponse.json(await digitalTwinRequest()); }
export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await digitalTwinRequest(request)); }
