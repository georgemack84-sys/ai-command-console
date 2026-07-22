import { NextResponse } from "next/server";
import { gatesRequest, requireProvingFoundationUser } from "../core";

export async function GET() { await requireProvingFoundationUser(); return NextResponse.json(await gatesRequest()); }
export async function POST(request: Request) { await requireProvingFoundationUser(); return NextResponse.json(await gatesRequest(request)); }
