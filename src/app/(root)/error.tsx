// app/(root)/error.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface RootErrorProps {
  error: Error;
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-semibold">Something went wrong.</h2>
      <p className="mt-2 text-gray-600">{error.message}</p>
      <Button className="mt-4" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
