import { NextResponse } from "next/server";
import { requireSkillRegistryUser, versionsRequest } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await versionsRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await versionsRequest(request)); }
