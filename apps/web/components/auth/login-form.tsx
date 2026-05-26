"use client";

import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";

type LoginForm = {
  email: string;
  password: string;
};

export function LoginForm() {
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    const { data: session, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      console.error(error);
    } else {
      console.log("Logged in:", session);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        {...register("email")}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        {...register("password")}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        Login
      </button>
    </form>
  );
}