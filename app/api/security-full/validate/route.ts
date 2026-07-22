import { NextResponse } from "next/server";
import { requireSecurityFullUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await validateRequest(request)); }
