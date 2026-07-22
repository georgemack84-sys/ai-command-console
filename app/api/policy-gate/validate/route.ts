import { NextResponse } from "next/server";
import { requirePolicyGateUser, validateRequest } from "../core";

export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await validateRequest(request)); }
