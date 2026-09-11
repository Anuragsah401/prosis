import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/packages/orchestrator/auth-service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const sessionTokenHeader = req.headers.get("x-prosis-session");
    const sessionCookie = req.cookies.get("prosis_session")?.value;

    const token = sessionTokenHeader || sessionCookie || null;
    const session = AuthService.resolveSession({
      authorization: authHeader,
      sessionToken: token,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "No active session found." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session,
      },
    });
  } catch (err: any) {
    console.error("[Auth API Session] Error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: err.message || "Failed to resolve session." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Logout action
    const sessionTokenHeader = req.headers.get("x-prosis-session");
    const sessionCookie = req.cookies.get("prosis_session")?.value;
    const token = sessionTokenHeader || sessionCookie;

    if (token) {
      AuthService.logout(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Session terminated successfully.",
    });

    // Clear session cookie
    response.cookies.delete("prosis_session");
    return response;
  } catch (err: any) {
    console.error("[Auth API Logout] Error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: err.message || "Failed to terminate session." },
      { status: 500 }
    );
  }
}

