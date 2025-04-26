"use client";

import { IUser } from "@/models/User";
import React from "react";

const SignUp = () => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData: IUser = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as "admin" | "user",
      subRole: formData.get("subRole") as "teacher" | "student",
      emailVerified: false,
      createdAt: new Date(),
    };
    await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full p-16 bg-white items-center justify-center h-screen"
    >
      <div>
        <label htmlFor="name">Name</label>
        <input type="text" name="name" id="name" required />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" name="password" id="password" required />
      </div>
      <div>
        <label htmlFor="role">Role</label>
        <select name="role" id="role" required>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>
      <div>
        <label htmlFor="subRole">Sub Role</label>
        <select name="subRole" id="subRole" required>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default SignUp;
