import { NextResponse } from "next/server";
import { requireProvingRegistryUser, versionsRequest } from "../core";

export async function GET() { await requireProvingRegistryUser(); return NextResponse.json(await versionsRequest()); }
export async function POST(request: Request) { await requireProvingRegistryUser(); return NextResponse.json(await versionsRequest(request)); }
