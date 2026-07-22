import { NextResponse } from "next/server";
import { requirePlatformOperationsUser, validateRequest } from "../core";
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await validateRequest(request)); }
