// models/User.ts
"use server";
import { hashPassword } from "@/lib/crypto";
import client from "@/lib/mongo";
import { addUserSchema } from "@/lib/validations";
import { ObjectId, Collection, MongoError, MongoServerError } from "mongodb";
import { AddUser, IUser, User } from "./user.types";

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

class UserModel {
  /**
   * Creates a new user.
   * - Validates email, name, password, and subRole
   * - Hashes password
   * - Inserts into Mongo
   * - Strips password from returned object
   * Throws an error if email is already in use.
   */
  async createUser(data: AddUser): Promise<User> {
    addUserSchema.parse(data); // validate all fields

    const { email, password, firstName, lastName, role } = data;

    const hashed = await hashPassword(password);

    const userDoc: Omit<IUser, "_id"> = {
      email,
      password: hashed,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role,
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
    if (update.firstName !== undefined) {
      addUserSchema.shape.firstName.parse(update.firstName); // validate name
    }
    if (update.lastName !== undefined) {
      addUserSchema.shape.lastName.parse(update.lastName); // validate name
    }
    if (update.password !== undefined) {
      addUserSchema.shape.password.parse(update.password); // validate password
      update.password = await hashPassword(update.password);
    }

    const coll = await getUsersCollection();
    const result = await coll.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...update,
          // ensure trimmed name if updated
          ...(update.firstName !== undefined
            ? { name: update.firstName.trim() }
            : {}),
          ...(update.lastName !== undefined
            ? { name: update.lastName.trim() }
            : {}),
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
