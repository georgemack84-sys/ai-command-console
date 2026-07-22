import { NextResponse } from "next/server";
import { registryRequest, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await registryRequest(request)); }
