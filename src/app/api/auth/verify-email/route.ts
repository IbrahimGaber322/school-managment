// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import tokenModel from "@/models/Token/token.model.ts";
import userModel from "@/models/User/user.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.redirect("/auth?error=Invalid");
    }

    // 1. Fetch & validate the token via TokenModel
    const doc = await tokenModel.findToken(token, "verify");
    if (!doc) {
      return NextResponse.redirect("/auth?error=Expired");
    }

    // 2. Mark the user verified via UserModel
    try {
      await userModel.updateUser(doc.userId.toHexString(), {
        emailVerified: true,
      });
    } catch (err) {
      console.error("Error verifying user:", err);
      // Optionally handle/log more robustly
    }

    // 3. Delete the token
    await tokenModel.deleteToken(token, "verify");

    return NextResponse.redirect("/auth?message=Verified");
  } catch (err) {
    console.error("Error in verify-email route:", err);
    return NextResponse.redirect("/auth?error=ServerError");
  }
}
