// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import tokenModel from "@/models/Token/token.model.ts";
import userModel from "@/models/User/user.model";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // 1. Basic request validation
    if (typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid token/password" },
        { status: 400 }
      );
    }

    // 2. Fetch & validate the reset token
    const tokenDoc = await tokenModel.findToken(token, "reset");
    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // 3. Update the user's password (will re-validate & hash)
    await userModel.updateUser(tokenDoc.userId.toHexString(), { password });

    // 4. Clean up the token
    await tokenModel.deleteToken(token, "reset");

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Error in reset-password route:", err);

    if (err instanceof Error) {
      // If the user wasn't found, respond 404; otherwise validation error 400
      const status = err.message === "User not found" ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }

    // Fallback for unexpected errors
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
