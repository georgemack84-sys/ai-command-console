import { NextResponse } from "next/server";
import { governanceApisRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await governanceApisRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await governanceApisRequest(request)); }
