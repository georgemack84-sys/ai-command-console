import { NextResponse } from "next/server";
import { requireBootstrapUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await validateRequest(request)); }
