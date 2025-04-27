/* /app/(auth)/verify-email/page.tsx */
"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader, CheckCircle2, XCircle } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ———————————————————————————— */
/* Types & schema                                                   */
/* ———————————————————————————— */

const schema = z.object({
  token: z.string().min(16, "Invalid token"),
});
type FormData = z.infer<typeof schema>;

type Status = "idle" | "verifying" | "success" | "error";

/* ———————————————————————————— */
/* Component                                                         */
/* ———————————————————————————— */

export default function VerifyEmailPage() {
  /* next-auth session (client-side) */
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* react-hook-form */
  const form = useForm<FormData>({
    defaultValues: { token: "" },
    resolver: zodResolver(schema),
  });

  /* transition for auto-verify or manual submit */
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  /* ——— 1. auto-verify if token param exists ——— */
  useEffect(() => {
    const paramToken = searchParams.get("token");
    if (paramToken && status === "idle") {
      form.setValue("token", paramToken); // pre-fill for UX
      handleVerify(paramToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ——— verify helper ——— */
  const handleVerify = (token: string) =>
    startTransition(async () => {
      setStatus("verifying");
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: "GET",
        });

        if (res.ok) {
          setStatus("success");
          setMessage("Your email is now verified. You can log in!");
          // If user is already signed-in but unverified, force a refresh:
          if (session) await signOut({ redirect: false });
          setTimeout(() => router.push("/login"), 2000);
        } else {
          const { error } = await res.json();
          setStatus("error");
          setMessage(
            error || "Verification failed. Token may be invalid or expired."
          );
        }
      } catch (_err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    });

  /* ——— manual submit ——— */
  const onSubmit: SubmitHandler<FormData> = (data) => handleVerify(data.token);

  /* ——— already verified & logged in ——— */
  if (session?.user?.emailVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-10 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-center">You are already verified and signed in.</p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ——— main UI ——— */
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="py-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isPending || status === "success"}
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Token</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste the token from your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending || status === "success"}
              className="mt-2"
            >
              {isPending ? <Loader className="animate-spin" /> : "Verify Email"}
            </Button>
          </form>
        </Form>

        {/* status feedback */}
        {status === "verifying" && (
          <p className="flex items-center gap-2 mt-6 text-sm">
            <Loader className="h-4 w-4 animate-spin" /> Verifying…
          </p>
        )}
        {status === "success" && (
          <p className="flex items-center gap-2 mt-6 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </p>
        )}
        {status === "error" && (
          <p className="flex items-center gap-2 mt-6 text-red-600 text-sm">
            <XCircle className="h-4 w-4" /> {message}
          </p>
        )}

        {/* optional resend */}
        {status === "error" && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              /* hit /api/auth/resend endpoint (not shown) */
            }}
          >
            Resend verification email
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
