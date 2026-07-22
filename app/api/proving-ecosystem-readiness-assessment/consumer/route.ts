import { NextResponse } from "next/server";
import { consumerRequest, requireEcosystemReadinessUser } from "../core";
export async function GET() { await requireEcosystemReadinessUser(); return NextResponse.json(await consumerRequest()); }
export async function POST(request: Request) { await requireEcosystemReadinessUser(); return NextResponse.json(await consumerRequest(request)); }
