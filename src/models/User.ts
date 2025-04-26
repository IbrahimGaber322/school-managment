// lib/user.ts
import bcrypt from "bcrypt";
import client from "@/lib/mongo";
import { ObjectId, Collection, MongoError, MongoServerError } from "mongodb";

export type Role = "admin" | "user";
export type SubRole = "teacher" | "student";

export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
  name: string;
  role: Role;
  subRole?: SubRole;
}

// Public user view (no password)
export type User = Omit<IUser, "password">;

// ———————————————
// Module‐scope flags for one-time setup
// ———————————————
let isConnected = false;
let isIndexed = false;

/**
 * Connects the MongoClient once and creates the unique email index once,
 * then returns the `users` collection.
 */
async function getUsersCollection(): Promise<Collection<IUser>> {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  const coll = client.db().collection<IUser>("users");
  if (!isIndexed) {
    await coll.createIndex({ email: 1 }, { unique: true });
    isIndexed = true;
  }
  return coll;
}

/** Ensures subRole is valid for the given role */
function validateSubRole(role: Role, subRole?: SubRole): boolean {
  if (role === "admin" && subRole !== undefined) return false;
  if (role === "user" && subRole && !["teacher", "student"].includes(subRole))
    return false;
  return true;
}

/** Validates format of an email address */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates password strength:
 *  - at least 8 chars
 *  - at least one uppercase letter
 *  - at least one lowercase letter
 *  - at least one digit
 */
function validatePassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

/** Validates name length (2–50 non-whitespace chars) */
function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

class UserModel {
  /**
   * Creates a new user.
   * - Validates email, name, password, and subRole
   * - Hashes password
   * - Inserts into Mongo
   * - Strips password from returned object
   * Throws an error if email is already in use.
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
    subRole?: SubRole;
  }): Promise<User> {
    const {
      email,
      password,
      name,
      role = "user",
      subRole = role === "user" ? "student" : undefined,
    } = data;

    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!validatePassword(password)) {
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      );
    }
    if (!validateName(name)) {
      throw new Error("Name must be between 2 and 50 characters");
    }
    if (!validateSubRole(role, subRole)) {
      throw new Error("Invalid subRole for the given role");
    }

    const hashed = await bcrypt.hash(password, 10);

    const userDoc: Omit<IUser, "_id"> = {
      email,
      password: hashed,
      name: name.trim(),
      role,
      subRole,
      emailVerified: false,
      createdAt: new Date(),
    };

    const coll = await getUsersCollection();
    let insertedId: ObjectId;
    try {
      const result = await coll.insertOne(userDoc);
      insertedId = result.insertedId;
    } catch (err: unknown) {
      if (
        (err instanceof MongoServerError || err instanceof MongoError) &&
        err.code === 11000
      ) {
        throw new Error("Email already in use");
      }
      throw err;
    }

    // strip password
    const { password: _, ...rest } = { ...userDoc, _id: insertedId };
    return rest;
  }

  /** Finds a user by email, returns without password */
  async getUserByEmail(email: string): Promise<User | null> {
    const coll = await getUsersCollection();
    const user = await coll.findOne({ email });
    if (!user) return null;
    const { password: _, ...rest } = user;
    return rest;
  }

  /** Finds a user by ID, returns without password */
  async getUserById(id: string): Promise<User | null> {
    const coll = await getUsersCollection();
    const user = await coll.findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    const { password: _, ...rest } = user;
    return rest;
  }

  /**
   * Updates one or more fields on a user.
   * - Validates name, password, subRole if provided
   * - Re-hashes password if provided
   * - Returns the updated user (without password)
   * Throws if no user was found.
   */
  async updateUser(
    id: string,
    update: Partial<Omit<IUser, "createdAt" | "email">> & { password?: string }
  ): Promise<User> {
    if (update.name !== undefined && !validateName(update.name)) {
      throw new Error("Name must be between 2 and 50 characters");
    }
    if (update.password !== undefined) {
      if (!validatePassword(update.password)) {
        throw new Error(
          "Password must be at least 8 characters and include uppercase, lowercase, and a number"
        );
      }
      update.password = await bcrypt.hash(update.password, 10);
    }
    if (update.role && update.subRole !== undefined) {
      if (!validateSubRole(update.role, update.subRole)) {
        throw new Error("Invalid subRole for the given role");
      }
    }

    const coll = await getUsersCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...update,
          // ensure trimmed name if updated
          ...(update.name !== undefined ? { name: update.name.trim() } : {}),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }

    const updated = await this.getUserById(id);
    if (!updated) throw new Error("Failed to fetch updated user");
    return updated;
  }

  /** Fetch the raw IUser (including password) for authentication */
  async getRawUserByEmail(email: string): Promise<IUser | null> {
    const coll = await getUsersCollection();
    return coll.findOne({ email });
  }
}

const userModel = new UserModel();
export default userModel;
