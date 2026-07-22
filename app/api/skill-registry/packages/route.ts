import { NextResponse } from "next/server";
import { packagesRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await packagesRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await packagesRequest(request)); }
