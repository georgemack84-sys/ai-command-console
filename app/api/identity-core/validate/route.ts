import { NextResponse } from "next/server";
import { requireIdentityCoreUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireIdentityCoreUser(); return NextResponse.json(await validateRequest(request)); }
