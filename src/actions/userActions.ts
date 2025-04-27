"use server";

import { sendMail } from "@/lib/mail";
import tokenModel from "@/models/Token/token.model.ts";
import userModel from "@/models/User/user.model";
import { Role, UserSignUp } from "@/models/User/user.types";

const signUp = async (userData: UserSignUp) => {
  // 1. Create the user (unverified)
  const user = await userModel.createUser({ ...userData, role: Role.STUDENT });

  // 2. Generate a 24-hour “verify” token
  const token = await tokenModel.createToken(
    user._id!.toHexString(),
    "verify",
    24 * 60 * 60 * 1000
  );

  // 3. Send the verification email
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  await sendMail(
    userData.email,
    "Please verify your email",
    `<p>Welcome! Please <a href="${url}">click here</a> to verify your email address.</p>`
  );
};

export { signUp };
