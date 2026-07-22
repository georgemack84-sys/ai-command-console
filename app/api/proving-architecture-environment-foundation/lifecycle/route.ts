import { NextResponse } from "next/server";
import { lifecycleRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await lifecycleRequest(request)); }
