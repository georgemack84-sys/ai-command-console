import { NextResponse } from "next/server";
import { requireSkillRegistryUser, testHarnessRequest } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(await testHarnessRequest()); }
export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await testHarnessRequest(request)); }
