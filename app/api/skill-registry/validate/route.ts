import { NextResponse } from "next/server";
import { requireSkillRegistryUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireSkillRegistryUser(); return NextResponse.json(await validateRequest(request)); }
