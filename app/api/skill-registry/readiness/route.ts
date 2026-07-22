import { NextResponse } from "next/server";
import { readinessRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await readinessRequest(request)); }
