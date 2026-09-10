"use client";
import { type FormEvent, useState } from "react";

export default function Page() {
  const [message, setMessage] = useState("Ready");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      setMessage(response.ok ? "Signed in" : "Sign in failed");
    } catch {
      setMessage("Service unavailable");
    }
  }
  async function logout() {
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      setMessage(response.ok ? "Signed out" : "Sign out failed");
    } catch {
      setMessage("Service unavailable");
    }
  }
  return (
    <main>
      <h1>Private documents</h1>
      <form onSubmit={login}>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit">Sign in</button>
      </form>
      <button type="button" onClick={logout}>
        Sign out
      </button>
      <p role="status">{message}</p>
    </main>
  );
}
