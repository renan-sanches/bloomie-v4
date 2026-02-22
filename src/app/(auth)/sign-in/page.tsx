"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace("/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-carbon">🌿 Bloomie</h1>
        <p className="text-sm text-brand-carbon/60 mt-1">Sign in to your jungle</p>
      </div>
      <form onSubmit={signIn} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] h-11"
        >
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      <Button
        variant="outline"
        onClick={signInWithGoogle}
        className="rounded-[16px] h-11"
      >
        Continue with Google
      </Button>
      <p className="text-sm text-center text-brand-carbon/60">
        No account?{" "}
        <Link href="/sign-up" className="text-brand-green font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  );
}
