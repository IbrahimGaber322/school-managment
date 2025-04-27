import { ObjectId } from "mongodb";

export enum Role {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin", // school owner
}

export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Public user view (no password)
export type User = Omit<IUser, "password">;

// Add user type to use in forms
export type AddUser = Omit<
  IUser,
  "_id" | "createdAt" | "emailVerified" | "updatedAt"
> & {
  role: Role.STUDENT | Role.TEACHER;
};

export type UserSignUp = Omit<AddUser, "role">;

// Update user type to use in forms
export type UpdateUser = Omit<Partial<UserSignUp>, "email">;
