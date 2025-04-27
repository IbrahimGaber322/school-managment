// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import userModel from "@/models/User/user.model";
import tokenModel from "@/models/Token/token.model.ts";
import { sendMail } from "@/lib/mail";
import { signUpSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Basic validation
    if (
      typeof email !== "string" ||
      signUpSchema.shape.email.safeParse(email).success === false
    ) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // 2. Lookup user (don’t reveal existence)
    const user = await userModel.getUserByEmail(email);

    if (user) {
      // 3. Issue a 1-hour reset token
      const token = await tokenModel.createToken(
        user._id!.toHexString(),
        "reset",
        60 * 60 * 1000
      );

      // 4. Send reset email
      const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      await sendMail(
        email,
        "Reset your password",
        `<p>You requested a password reset. <a href="${url}">Click here</a> to choose a new password.</p>`
      );
    }

    // Always return OK to avoid user-enumeration
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Error in forgot-password route:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
