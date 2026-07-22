import { NextResponse } from "next/server";
import { evidenceRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await evidenceRequest(request)); }
