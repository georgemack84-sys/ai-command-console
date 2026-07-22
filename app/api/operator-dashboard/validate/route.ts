import { NextResponse } from "next/server";
import { requireOperatorDashboardUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireOperatorDashboardUser(); return NextResponse.json(await validateRequest(request)); }
