"use client";
import Link from "next/link";

export default function Home() {
  return (
<main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center animate-fadeInUp">
<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 animate-pulse">
  AI Component Generator
</h1>
<p className="text-gray-200 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl px-2">
        Build, preview, and refine React components using AI — all in one place.
      </p>
<div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center w-full max-w-xs sm:max-w-none">
<Link href="/login" className="btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8">Login</Link>
<Link href="/signup" className="btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8">Sign Up</Link>
      </div>
    </main>
  );
}
