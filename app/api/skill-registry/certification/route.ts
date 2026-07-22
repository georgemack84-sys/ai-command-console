import { NextResponse } from "next/server";
import { certificationRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await certificationRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await certificationRequest(request)); }
