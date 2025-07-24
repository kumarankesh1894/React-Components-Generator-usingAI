"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 text-center">
      <h1 className="text-4xl font-bold mb-4">AI Component Generator</h1>
      <p className="text-gray-600 text-lg mb-8 max-w-xl">
        Build, preview, and refine React components using AI — all in one place.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
