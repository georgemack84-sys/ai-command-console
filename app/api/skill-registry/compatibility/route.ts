import { NextResponse } from "next/server";
import { compatibilityRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await compatibilityRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await compatibilityRequest(request)); }
