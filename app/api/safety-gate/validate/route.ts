import { NextResponse } from "next/server";
import { requireSafetyGateUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await validateRequest(request)); }
