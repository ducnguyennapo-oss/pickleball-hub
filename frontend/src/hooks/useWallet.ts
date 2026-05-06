"use client";
import useSWR from "swr";
import api from "@/lib/api";
import type { Wallet, Transaction } from "@/types";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR<Wallet>("/wallet/me", fetcher, {
    refreshInterval: 30000,
  });
  return { wallet: data, error, isLoading, refresh: mutate };
}

export function useTransactions() {
  const { data, isLoading } = useSWR<Transaction[]>("/wallet/me/transactions", fetcher);
  return { transactions: data || [], isLoading };
}
