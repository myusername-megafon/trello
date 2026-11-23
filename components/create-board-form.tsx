"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

export function CreateBoardForm() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    // Отправляем данные в Supabase
    const { error } = await supabase.from("boards").insert({ title });

    if (error) {
      alert("Ошибка при создании доски: " + error.message);
    } else {
      setTitle(""); // Очищаем поле ввода
      router.refresh(); // Обновляем серверные данные, чтобы новая доска появилась на экране
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleCreate} className="flex max-w-xl items-center gap-2">
      <div className="relative flex-1">
        <PlusCircle
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название новой доски…"
          className="w-full rounded-xl border border-white/25 bg-white/15 py-2.5 pl-10 pr-4 text-white placeholder-white/60 backdrop-blur transition focus:border-white/50 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="shrink-0 rounded-xl bg-white px-5 py-2.5 font-semibold text-indigo-700 shadow-md transition-all hover:bg-indigo-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Создание…" : "Создать доску"}
      </button>
    </form>
  );
}