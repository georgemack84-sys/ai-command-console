import { NextResponse } from "next/server";
import { archiveRequest, requireProvingRegistryUser } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await archiveRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await archiveRequest(request)); }
