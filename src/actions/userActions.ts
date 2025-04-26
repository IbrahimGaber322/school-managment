"use server";

import { sendMail } from "@/lib/mail";
import tokenModel from "@/models/Token";
import userModel, { IUser } from "@/models/User";

const signUp = async (userData: IUser) => {
  try {
    // 1. Create the user (unverified)
    const user = await userModel.createUser(userData);

    // 2. Generate a 24-hour “verify” token
    const token = await tokenModel.createToken(
      user._id!.toHexString(),
      "verify",
      24 * 60 * 60 * 1000
    );

    // 3. Send the verification email
    const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    await sendMail(
      user.email,
      "Please verify your email",
      `<p>Welcome! Please <a href="${url}">click here</a> to verify your email address.</p>`
    );

    return { ok: true };
  } catch (err: unknown) {
    console.error("Error in signup route:", err);

    // Handle any validation or duplicate-email errors thrown by createUser
    if (err instanceof Error) {
      return { error: err.message };
    }

    // Fallback for anything else
    return { error: "Unexpected server error" };
  }
};

export { signUp };
