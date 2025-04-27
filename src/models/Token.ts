// models/Token.ts
import { nanoid } from "nanoid";
import client from "@/lib/mongo";
import { ObjectId, Collection, MongoError, MongoServerError } from "mongodb";

export type TokenType = "verify" | "reset";

export interface IToken {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  type: TokenType;
  createdAt: Date;
  expiresAt: Date;
}

// ———————————————
// Module‐scope flags
// ———————————————
let isConnected = false;
let isIndexed = false;

/**
 * Connect once, then ensure:
 *  • unique index on `token`
 *  • TTL index on `expiresAt`
 */
async function getTokensCollection(): Promise<Collection<IToken>> {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  const coll = client.db().collection<IToken>("tokens");
  if (!isIndexed) {
    // unique per token string
    await coll.createIndex({ token: 1 }, { unique: true });
    // auto-delete docs once `expiresAt` passes
    await coll.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    isIndexed = true;
  }
  return coll;
}

/** Safely turn a hex string into ObjectId or throw */
function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new ObjectId(id);
}

class TokenModel {
  /**
   * Generate & store a new token.
   * @param userId  – hex string of the user’s ID
   * @param type    – "verify" or "reset"
   * @param ttlMs   – time until expiry, in milliseconds
   * @returns the raw token string
   */
  async createToken(
    userId: string,
    type: TokenType,
    ttlMs: number
  ): Promise<string> {
    const coll = await getTokensCollection();
    const token = nanoid();
    const now = new Date();
    const doc: IToken = {
      token,
      userId: toObjectId(userId),
      type,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
    };

    try {
      await coll.insertOne(doc);
    } catch (err: unknown) {
      if (
        (err instanceof MongoServerError || err instanceof MongoError) &&
        err.code === 11000
      ) {
        // collision? try again
        return this.createToken(userId, type, ttlMs);
      }
      throw err;
    }

    return token;
  }

  /**
   * Fetch a token doc (auto-expiring if past `expiresAt`).
   * @returns null if not found or expired
   */
  async findToken(token: string, type?: TokenType): Promise<IToken | null> {
    const coll = await getTokensCollection();
    const query: Partial<IToken> = { token };
    if (type) query.type = type;
    const doc = await coll.findOne(query);
    if (!doc) return null;

    if (doc.expiresAt < new Date()) {
      // expired: remove and treat as null
      await coll.deleteOne({ _id: doc._id });
      return null;
    }

    return doc;
  }

  /** Delete a specific token */
  async deleteToken(token: string, type?: TokenType): Promise<boolean> {
    const coll = await getTokensCollection();
    const query: Partial<IToken> = { token };
    if (type) query.type = type;
    const res = await coll.deleteOne(query);
    return res.deletedCount === 1;
  }

  /** Revoke *all* tokens for a user (optionally of one type) */
  async revokeUserTokens(userId: string, type?: TokenType): Promise<number> {
    const coll = await getTokensCollection();
    const query: Partial<IToken> = {
      userId: toObjectId(userId),
    };
    if (type) query.type = type;
    const res = await coll.deleteMany(query);
    return res.deletedCount ?? 0;
  }
}

const tokenModel = new TokenModel();
export default tokenModel;
