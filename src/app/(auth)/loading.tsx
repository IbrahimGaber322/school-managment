// app/(auth)/loading.tsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="animate-spin h-8 w-8" />
    </div>
  );
}
