import { NextResponse } from "next/server";
import { requireFederationUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await validateRequest(request)); }
