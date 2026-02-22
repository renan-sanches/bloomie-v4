"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setUserProfile } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await setUserProfile(user.uid, {
        uid: user.uid,
        displayName: name,
        email,
        level: 1,
        xp: 0,
        streak: 0,
        longestStreak: 0,
        preferences: {},
        achievements: [],
      });
      router.replace("/dashboard");
    } catch {
      setError("Sign up failed. Use a valid email and a password of at least 6 characters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-carbon">🌿 Bloomie</h1>
        <p className="text-sm text-brand-carbon/60 mt-1">Start your indoor jungle</p>
      </div>
      <form onSubmit={signUp} className="flex flex-col gap-4">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded-[16px] h-11"
        >
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
      <p className="text-sm text-center text-brand-carbon/60">
        Have an account?{" "}
        <Link href="/sign-in" className="text-brand-green font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
