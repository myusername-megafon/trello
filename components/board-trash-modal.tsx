"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function BoardTrashModal({ isOpen, onClose, boardId }: { isOpen: boolean, onClose: () => void, boardId: string }) {
  const [trashLists, setTrashLists] = useState<any[]>([]);
  const [trashCards, setTrashCards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"cards" | "lists">("cards");
  const supabase = createClient();

  // Загружаем корзину только для этой доски
  useEffect(() => {
    if (!isOpen) return;
    const fetchTrash = async () => {
      const { data: lists } = await supabase.from("trash_lists").select("*").eq("board_id", boardId);
      const { data: cards } = await supabase.from("trash_cards").select("*").eq("board_id", boardId);
      setTrashLists(lists || []);
      setTrashCards(cards || []);
    };
    fetchTrash();
  }, [isOpen, boardId, supabase]);

  if (!isOpen) return null;

  // Восстановление карточки
  const handleRestoreCard = async (card: any) => {
    // Проверяем, существует ли колонка
    const { data: listExists } = await supabase.from("lists").select("id").eq("id", card.list_id).single();
    if (!listExists) {
      alert("Невозможно восстановить: колонка удалена. Сначала восстановите колонку.");
      return;
    }

    const { error } = await supabase.from("cards").insert({
  list_id: card.list_id,
  title: card.title,
  description: card.description,
  position: card.position,
});
    
    if (error) return alert(error.message);
    
    await supabase.from("trash_cards").delete().eq("id", card.id);
    setTrashCards((prev) => prev.filter((c) => c.id !== card.id));
  };

  // Восстановление колонки (и её карточек)
  const handleRestoreList = async (list: any) => {
    const { error } = await supabase.from("lists").insert({
  board_id: list.board_id,
  title: list.title,
  position: list.position,
});
    if (error) return alert(error.message);

    // Восстанавливаем карточки, которые были в этой колонке
    const cardsToRestore = trashCards.filter((c) => c.list_id === list.original_id);
    if (cardsToRestore.length > 0) {
      await supabase.from("cards").insert(cardsToRestore.map(c => ({
  list_id: c.list_id,
  title: c.title,
  description: c.description,
  position: c.position,
})));
      await supabase.from("trash_cards").delete().in("id", cardsToRestore.map(c => c.id));
      setTrashCards((prev) => prev.filter((c) => !cardsToRestore.find(tc => tc.id === c.id)));
    }

    await supabase.from("trash_lists").delete().eq("id", list.id);
    setTrashLists((prev) => prev.filter((l) => l.id !== list.id));
  };

  // Окончательное удаление
  const handlePermanentDeleteCard = async (id: number) => {
    if (!confirm("Удалить навсегда?")) return;
    await supabase.from("trash_cards").delete().eq("id", id);
    setTrashCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handlePermanentDeleteList = async (id: number) => {
    if (!confirm("Удалить колонку и все её карточки навсегда?")) return;
    await supabase.from("trash_lists").delete().eq("id", id);
    await supabase.from("trash_cards").delete().eq("list_id", id);
    setTrashLists((prev) => prev.filter((l) => l.id !== id));
    setTrashCards((prev) => prev.filter((c) => c.list_id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Корзина доски</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
        </div>

        <div className="flex border-b">
          <button onClick={() => setActiveTab("cards")} className={`px-4 py-2 text-sm font-medium ${activeTab === "cards" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>
            Карточки ({trashCards.length})
          </button>
          <button onClick={() => setActiveTab("lists")} className={`px-4 py-2 text-sm font-medium ${activeTab === "lists" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>
            Колонки ({trashLists.length})
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === "cards" && (
            <div className="flex flex-col gap-2">
              {trashCards.length === 0 ? <p className="text-gray-500 text-sm">Пусто</p> : trashCards.map(card => (
                <div key={card.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                  <span className="text-gray-800 text-sm">{card.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRestoreCard(card)} className="text-green-600 hover:underline text-xs">Восстановить</button>
                    <button onClick={() => handlePermanentDeleteCard(card.id)} className="text-red-600 hover:underline text-xs">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "lists" && (
            <div className="flex flex-col gap-2">
              {trashLists.length === 0 ? <p className="text-gray-500 text-sm">Пусто</p> : trashLists.map(list => (
                <div key={list.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                  <span className="text-gray-800 text-sm">{list.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleRestoreList(list)} className="text-green-600 hover:underline text-xs">Восстановить</button>
                    <button onClick={() => handlePermanentDeleteList(list.id)} className="text-red-600 hover:underline text-xs">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}