// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { signUp } from "@/actions/userActions";

export async function POST(req: Request) {
  try {
    const userData = await req.json();

    await signUp(userData);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Error in signup route:", err);

    // Handle any validation or duplicate-email errors thrown by createUser
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Fallback for anything else
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
