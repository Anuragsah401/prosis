import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/packages/orchestrator/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "MISSING_IDENTIFIER", message: "Email or User ID is required." },
        { status: 400 }
      );
    }

    const session = AuthService.login(identifier, password);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "INVALID_CREDENTIALS", message: "Invalid credentials or unauthorized user account." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        session,
      },
    });

    // Set cookie for session persistence
    response.cookies.set("prosis_session", session.sessionToken, {
      path: "/",
      httpOnly: false, // accessible to client script if needed
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error("[Auth API Login] Error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: err.message || "Failed to process login." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return demo users for the login UI
  const demoUsers = AuthService.getDemoUsers();
  return NextResponse.json({
    success: true,
    data: {
      demoUsers,
    },
  });
}

