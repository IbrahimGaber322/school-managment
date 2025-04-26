"use server";

import dbConnect from "@/db/dbConnect";
import UserModel, { type User } from "@/db/models/user";

const signUp = async (userData: User) => {
  console.log("User data:", userData);
  try {
    await dbConnect();
    console.log("Connected to database");
    const user = new UserModel(userData);
    console.log("User instance created:", user);
    const savedUser = await user.save();
    console.log("User saved:", savedUser);
  } catch (error) {
    console.log(error);
  }
};

export { signUp };
