import { NextResponse } from "next/server";
import { requireRegistryFullUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await validateRequest(request)); }
