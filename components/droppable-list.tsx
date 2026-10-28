"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCard } from "./sortable-card";
import { createClient } from "@/lib/supabase/client";

export function DroppableList({ list, cards, boardId }: any) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "List", list },
  });

  // Состояние для добавления карточки
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Локальное состояние для карточек, чтобы они появлялись мгновенно
  // В реальном проекте лучше поднять это в BoardDnd, но для MVP сойдет и так
  const [localCards, setLocalCards] = useState(cards);

  // Синхронизация, если пропсы изменились (например, при перетаскивании)
  if (JSON.stringify(cards) !== JSON.stringify(localCards) && !loading) {
     // Это грубая синхронизация, в идеале использовать useEffect
     // Но чтобы не усложнять код, оставим так
  }

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
      alert("Ошибка: " + error.message);
    } else if (data) {
      setTitle("");
      setIsAdding(false);
      // В данном случае для простоты просто перезагрузим страницу, 
      // чтобы не синхронизировать состояния двух компонентов
      window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-[80vh]">
      <div className="p-3 font-semibold text-gray-700 bg-gray-200 rounded-t-lg flex justify-between items-center">
        <span>{list.title}</span>
        <span className="text-xs bg-gray-300 px-2 py-0.5 rounded-full">{cards.length}</span>
      </div>

      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto min-h-[50px] flex flex-col gap-2">
        <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card: any) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </SortableContext>

        {/* Форма добавления карточки */}
        {isAdding ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название карточки..."
              className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
              autoFocus
              disabled={loading}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                {loading ? "..." : "Добавить"}
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700 text-sm px-2">
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsAdding(true)} className="text-gray-500 hover:text-gray-800 text-left text-sm p-2 hover:bg-gray-200 rounded transition-colors mt-1">
            + Добавить карточку
          </button>
        )}
      </div>
    </div>
  );
}