// app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setLoginError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    if (res?.error) {
      setLoginError(res.error);
    } else {
      router.push("/");
    }
  };

  return (
    <Card className="w-full">
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <Button type="submit" className="mt-4">
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
