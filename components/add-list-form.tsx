"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AddListForm({ boardId, currentListsCount }: { boardId: string, currentListsCount: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("lists").insert({
      board_id: boardId,
      title: title,
      position: currentListsCount, // Ставим новую колонку в конец
    });

    if (error) {
      alert("Ошибка при создании колонки: " + error.message);
    } else {
      setTitle("");
      setIsEditing(false);
      router.refresh(); // Обновляем данные на странице
    }
    setLoading(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="bg-white/30 hover:bg-white/40 text-white w-72 flex-shrink-0 p-3 rounded-lg text-left transition-colors font-medium"
      >
        + Добавить колонку
      </button>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg w-72 flex-shrink-0 p-3">
      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название колонки..."
          className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoFocus
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? "Добавление..." : "Добавить"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}