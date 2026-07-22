import { NextResponse } from "next/server";
import { requireCapabilityRegistryUser, toolBindingsRequest } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await toolBindingsRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await toolBindingsRequest(request)); }
