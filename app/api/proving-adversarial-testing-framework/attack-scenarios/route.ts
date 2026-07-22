import { NextResponse } from "next/server";
import { attackScenariosRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await attackScenariosRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await attackScenariosRequest(request)); }
