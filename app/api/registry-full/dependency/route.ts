import { NextResponse } from "next/server";
import { dependencyRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await dependencyRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await dependencyRequest(request)); }
