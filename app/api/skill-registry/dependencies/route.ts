import { NextResponse } from "next/server";
import { dependenciesRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await dependenciesRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await dependenciesRequest(request)); }
