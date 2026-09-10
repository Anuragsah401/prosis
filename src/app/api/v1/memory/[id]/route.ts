import { NextRequest, NextResponse } from "next/server";
import { Memory } from "@/packages/memory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "org_acme_corp";

    const record = await Memory.getById(id, orgId);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Memory record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve memory record" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { content, enabled, importance, type, orgId } = body;

    const organizationId = orgId || "org_acme_corp";
    const updated = Memory.update(
      id,
      {
        ...(content !== undefined && { content }),
        ...(enabled !== undefined && { enabled }),
        ...(importance !== undefined && { importance }),
        ...(type !== undefined && { type }),
      },
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Memory record updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update memory record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || "org_acme_corp";

    const success = Memory.delete(id, orgId);

    return NextResponse.json({
      success,
      deletedId: id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete memory record" },
      { status: 500 }
    );
  }
}
