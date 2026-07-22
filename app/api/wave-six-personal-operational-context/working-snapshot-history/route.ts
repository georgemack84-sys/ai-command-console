import { NextResponse } from "next/server";
import { requireWaveSixPersonalOperationalContextUser, workingSnapshotHistoryRequest } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await workingSnapshotHistoryRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await workingSnapshotHistoryRequest(request)); }
