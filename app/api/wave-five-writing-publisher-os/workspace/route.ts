import { NextResponse } from "next/server";
import { requireWaveFiveWritingPublisherUser, workspaceRequest } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await workspaceRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await workspaceRequest(request)); }
