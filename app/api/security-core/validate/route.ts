import { NextResponse } from "next/server";
import { requireSecurityCoreUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await validateRequest(request)); }
