import { NextResponse } from "next/server";
import { contractResponse, requireSkillRegistryUser } from "../core";

export async function GET() { await requireSkillRegistryUser(); return NextResponse.json(contractResponse()); }
