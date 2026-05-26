"use client";

import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";

type SignupForm = {
  email: string;
  password: string;
  name: string;
};

export function SignupForm() {
  const { register, handleSubmit } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    const { data: session, error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    if (error) {
      console.error(error);
    } else {
      console.log("Signed up:", session);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Name"
        {...register("name")}
        className="border p-2 rounded"
      />
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
      <button type="submit" className="bg-green-600 text-white p-2 rounded">
        Sign Up
      </button>
    </form>
  );
}