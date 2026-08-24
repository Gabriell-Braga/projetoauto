"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/client/api";

/** Usado nas telas fora do shell (bloqueado, trocar senha). */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await apiPost("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      loading={loading}
      onClick={handleLogout}
    >
      <LogOut className="h-3.5 w-3.5" />
      Sair
    </Button>
  );
}
