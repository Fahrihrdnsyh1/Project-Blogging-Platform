"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import api from "@/lib/api";

interface FormError {
  field: string;
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors([]);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { success, data, message: apiMessage } = response.data;

      if (!success) {
        setMessage(apiMessage || "Login failed");
        setErrors(response.data.errors || []);
        return;
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || "Login failed";
      const serverErrors = error?.response?.data?.errors || [];

      setMessage(serverMessage);
      setErrors(serverErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <Card as="div" className="w-full max-w-md bg-white p-7 sm:p-8">
        <div className="mb-7 border-b-3 border-ink pb-5">
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
            Blog//Lab access
          </p>
          <h1 className="mt-3 font-display text-4xl font-black text-ink">
            Login
          </h1>
          <p className="mt-2 font-body text-sm leading-6 text-ink/70">
            Masuk ke akun blog Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="mb-2 block font-display text-sm font-bold text-ink"
              htmlFor="login-email"
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block font-display text-sm font-bold text-ink"
              htmlFor="login-password"
            >
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Anda"
              required
            />
          </div>

          {(message || errors.length > 0) && (
            <div className="border-3 border-ink bg-coral p-3 font-body text-sm text-ink shadow-brutal-sm">
              {message && <p className="font-bold">{message}</p>}
              {errors.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 font-medium">
                  {errors.map((error, index) => (
                    <li key={`${error.field}-${index}`}>
                      {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>

        <p className="mt-7 border-t-2 border-ink pt-5 text-center font-body text-sm text-ink/70">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-display font-bold text-ink underline decoration-2 underline-offset-4 hover:bg-butter"
          >
            Daftar sekarang
          </a>
        </p>
      </Card>
    </main>
  );
}
