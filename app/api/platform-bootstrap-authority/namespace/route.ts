import { NextResponse } from "next/server";
import { namespaceRequest, requireBootstrapUser } from "../core";
export async function GET() { await requireBootstrapUser(); return NextResponse.json(await namespaceRequest()); }
export async function POST(request: Request) { await requireBootstrapUser(); return NextResponse.json(await namespaceRequest(request)); }
