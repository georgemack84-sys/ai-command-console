import { NextResponse } from "next/server";
import { requireStorageFullUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireStorageFullUser(); return NextResponse.json(await validateRequest(request)); }
