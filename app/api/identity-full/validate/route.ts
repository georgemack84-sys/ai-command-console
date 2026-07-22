import { NextResponse } from "next/server";
import { requireIdentityFullUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await validateRequest(request)); }
