// app/(root)/layout.tsx
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b py-4 px-6">
        <h1 className="text-xl font-bold">My App</h1>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">{children}</main>
      <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} My App. All rights reserved.
      </footer>
    </div>
  );
}
