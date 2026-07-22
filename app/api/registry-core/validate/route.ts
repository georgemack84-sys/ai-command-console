import { NextResponse } from "next/server";
import { requireRegistryCoreUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireRegistryCoreUser(); return NextResponse.json(await validateRequest(request)); }
