import { NextResponse } from "next/server";
import { requireStorageCoreUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireStorageCoreUser(); return NextResponse.json(await validateRequest(request)); }
