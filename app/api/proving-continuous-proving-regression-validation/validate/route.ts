import { NextResponse } from "next/server";
import { requireContinuousProvingUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireContinuousProvingUser(); return NextResponse.json(await validateRequest(request)); }
