import { NextResponse } from "next/server";
import { requireCrossProgramIntegrationUser, workflowRequest } from "../core";
export async function GET() { await requireCrossProgramIntegrationUser(); return NextResponse.json(await workflowRequest()); }
export async function POST(request: Request) { await requireCrossProgramIntegrationUser(); return NextResponse.json(await workflowRequest(request)); }
