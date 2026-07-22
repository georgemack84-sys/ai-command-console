import { NextResponse } from "next/server";
import { requireSyntheticGenerationUser, usersRequest } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await usersRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await usersRequest(request)); }
