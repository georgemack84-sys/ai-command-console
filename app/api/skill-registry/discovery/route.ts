import { NextResponse } from "next/server";
import { discoveryRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await discoveryRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await discoveryRequest(request)); }
