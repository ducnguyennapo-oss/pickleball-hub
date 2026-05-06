"use client";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
}
