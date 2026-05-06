export interface User {
  id: string;
  phone: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  balance: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: "topup" | "deduct" | "refund";
  amount: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

export interface Court {
  id: string;
  name: string;
  description: string | null;
}

export interface SlotDefinition {
  id: string;
  slot_index: number;
  start_time: string;
  end_time: string;
  price: number;
  max_players: number;
}

export interface CourtSlot {
  id: string;
  slot_index: number;
  start_time: string;
  end_time: string;
  price: number;
  max_players: number;
  current_players: number;
  status: "available" | "partial" | "full" | "closed";
}

export interface CourtAvailability {
  court: Court;
  slots: CourtSlot[];
}

export interface Booking {
  id: string;
  status: "confirmed" | "cancelled" | "attended" | "no_show";
  amount_charged: number;
  booked_at: string;
  cancelled_at: string | null;
  court_name: string;
  play_date: string;
  start_time: string;
  end_time: string;
}

export interface SSEEvent {
  type: "slot_update" | "ping";
  court_slot_id?: string;
  current_players?: number;
  max_players?: number;
  status?: string;
}
