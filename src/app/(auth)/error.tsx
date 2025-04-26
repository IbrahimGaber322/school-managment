// app/(auth)/error.tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <Card className="w-full max-w-md border-red-200">
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>{error.message}</CardDescription>
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
