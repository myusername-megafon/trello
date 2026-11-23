"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Trash2 } from "lucide-react";

/**
 * Компактные действия в шапке главной страницы:
 * кнопка выхода и корзина (только если там что-то есть).
 */
export function HeaderActions({
  email,
  trashCount,
}: {
  email?: string;
  trashCount: number;
}) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex items-center gap-3">
      {trashCount > 0 && (
        <Link
          href="/trash"
          title="Общая корзина удалённых колонок и карточек"
          className="relative flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
        >
          <Trash2 size={16} />
          Корзина
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow">
            {trashCount}
          </span>
        </Link>
      )}

      {email && (
        <span className="hidden max-w-[220px] truncate text-sm text-white/80 md:block">
          {email}
        </span>
      )}

      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500/80"
      >
        <LogOut size={16} />
        Выйти
      </button>
    </div>
  );
}
