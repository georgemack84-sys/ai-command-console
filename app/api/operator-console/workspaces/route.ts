import { NextResponse } from "next/server";
import { requireOperatorConsoleUser, workspacesRequest } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await workspacesRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await workspacesRequest(request)); }
