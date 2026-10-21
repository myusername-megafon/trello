"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <form onSubmit={handleCreate} className="flex gap-2 items-center">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название новой доски..."
        className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Создание..." : "Создать доску"}
      </button>
    </form>
  );
}