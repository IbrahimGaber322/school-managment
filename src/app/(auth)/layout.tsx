// app/(auth)/layout.tsx
"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SessionProvider } from "next-auth/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </SessionProvider>
  );
}
