import { ObjectId } from "mongodb";

export type TokenType = "verify" | "reset";

export interface IToken {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  type: TokenType;
  createdAt: Date;
  expiresAt: Date;
}
