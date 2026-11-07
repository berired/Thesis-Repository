"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { safeNext } from "@/app/lib/safe-next";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await authClient.signUp.email({ name, email, password });

        setLoading(false);
        if (error) {
            setError(error.message ?? "Unable to sign up");
            return;
        }
        router.push(safeNext(new URLSearchParams(window.location.search).get("next")));
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className = "flex flex-col gap-4">
            <h1 className = "text-2xl font-semibold">Create an account</h1>

            <label className = "flex flex-col gap-1 text-sm">
                Name
                <input 
                    type = "text"
                    required
                    autoComplete = "name"
                    value = {name}
                    onChange = {(e) => setName(e.target.value)}
                    className = "rounded border px-3 py-2"
                />
            </label>

            <label className = "flex flex-col gap-1 text-sm">
                Email
                <input
                    type = "email"
                    required
                    autoComplete = "email"
                    value = {email}
                    onChange = {(e) => setEmail(e.target.value)}
                    className = "rounded border px-3 py-2" 
                />
            </label>

            <label className = "flex flex-col gap-1 text-sm">
                Password
                <input 
                    type = "password"
                    required
                    autoComplete = "new-password"
                    value = {password}
                    onChange = {(e) => setPassword(e.target.value)}
                    className = "rounded border px-3 py-2"                
                />
            </label> 

            {error && <p className = "text-sm text-red-600">{error}</p>}

            <button
                type = "submit"
                disabled = {loading}
                className = "rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            >
                {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className = "text-sm">
                Already have an account?{" "}
                <Link href = "/sign-in" className = "underline">
                Sign in
                </Link>
                </p>
        </form>
    );
}