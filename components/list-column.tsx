"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Типизируем наши данные (чтобы TypeScript не ругался)
type Card = {
  id: number;
  title: string;
  list_id: number;
};

type ListColumnProps = {
  list: { id: number; title: string };
  initialCards: Card[];
};

export function ListColumn({ list, initialCards }: ListColumnProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("cards")
      .insert({ list_id: list.id, title: title, position: cards.length })
      .select()
      .single();

    if (error) {
      alert("Ошибка при создании карточки: " + error.message);
    } else if (data) {
      setCards([...cards, data]); // Мгновенно добавляем карточку на экран
      setTitle("");
      setIsAdding(false);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full">
      {/* Заголовок колонки */}
      <div className="p-3 font-semibold text-gray-700 bg-gray-200 rounded-t-lg flex justify-between items-center">
        <span>{list.title}</span>
        <span className="text-xs bg-gray-300 px-2 py-0.5 rounded-full">{cards.length}</span>
      </div>

      {/* Список карточек */}
      <div className="p-3 flex-1 overflow-y-auto min-h-[50px] flex flex-col gap-2">
        {cards.map((card) => (
          <div key={card.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 text-gray-800 text-sm">
            {card.title}
          </div>
        ))}

        {/* Форма добавления */}
        {isAdding ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название карточки..."
              className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? "..." : "Добавить"}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-2"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="text-gray-500 hover:text-gray-800 text-left text-sm p-2 hover:bg-gray-200 rounded transition-colors mt-1"
          >
            + Добавить карточку
          </button>
        )}
      </div>
    </div>
  );
}