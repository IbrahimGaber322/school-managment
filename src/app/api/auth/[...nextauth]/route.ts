// app/api/auth/[...nextauth]/route.ts
import NextAuth, { Session, SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/mongo";
import { JWT } from "next-auth/jwt";

import userModel from "@/models/User/user.model";
import { IUser } from "@/models/User/user.types";
import { verifyPassword } from "@/lib/crypto";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified?: boolean;
    };
  }
}

export const authOptions = {
  adapter: MongoDBAdapter(client),
  session: { strategy: "jwt" as SessionStrategy },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Basic validation
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          throw new Error("Missing email or password");
        }

        // Fetch raw user (with hashed password)
        const rawUser: IUser | null = await userModel.getRawUserByEmail(
          credentials.email
        );
        if (!rawUser) {
          throw new Error("Invalid credentials");
        }

        // Compare password
        const isValid = await verifyPassword(
          credentials.password,
          rawUser.password
        );
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        //  Check emailVerified
        if (!rawUser.emailVerified) {
          throw new Error("Please verify your email before signing in");
        }

        // Return minimal user object for JWT
        return {
          id: rawUser._id!.toHexString(),
          email: rawUser.email,
        };
      },
    }),
  ],

  callbacks: {
    // Store user.id on the JWT token
    async jwt({ token, user }: { token: JWT; user?: { id: string } }) {
      if (user) token.id = user.id;
      return token;
    },
    // Expose user.id and email in the session
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      session.user = {
        id: token.id as string,
        email: session.user?.email ?? "",
        emailVerified: session.user?.emailVerified ?? false,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
