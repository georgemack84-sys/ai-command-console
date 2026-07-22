import { NextResponse } from "next/server";
import { requireAdversarialTestingUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await validateRequest(request)); }
