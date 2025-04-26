// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import tokenModel from "@/models/Token";
import userModel from "@/models/User";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // 1. Create the user (unverified)
    const user = await userModel.createUser({ email, password, name });

    // 2. Generate a 24-hour “verify” token
    const token = await tokenModel.createToken(
      user._id!.toHexString(),
      "verify",
      24 * 60 * 60 * 1000
    );

    // 3. Send the verification email
    const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    await sendMail(
      email,
      "Please verify your email",
      `<p>Welcome! Please <a href="${url}">click here</a> to verify your email address.</p>`
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Error in signup route:", err);

    // Handle any validation or duplicate-email errors thrown by createUser
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Fallback for anything else
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
