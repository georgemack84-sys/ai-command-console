import { NextResponse } from "next/server";
import { requireProvingFoundationUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await validateRequest(request)); }
