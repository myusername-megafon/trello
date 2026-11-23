"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RotateCcw, Trash2, X } from "lucide-react";

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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Trash2 size={18} className="text-indigo-600" />
            Корзина доски
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-5">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === "cards" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Карточки ({trashCards.length})
          </button>
          <button
            onClick={() => setActiveTab("lists")}
            className={`px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === "lists" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Колонки ({trashLists.length})
          </button>
        </div>

        <div className="nice-scroll flex-1 overflow-y-auto p-5">
          {activeTab === "cards" && (
            <div className="flex flex-col gap-2">
              {trashCards.length === 0 ? (
                <EmptyState text="Удалённых карточек нет" />
              ) : (
                trashCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="truncate text-sm text-slate-800">{card.title}</span>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => handleRestoreCard(card)} className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-200">
                        <RotateCcw size={13} />
                        Восстановить
                      </button>
                      <button onClick={() => handlePermanentDeleteCard(card.id)} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200">
                        <X size={13} />
                        Навсегда
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "lists" && (
            <div className="flex flex-col gap-2">
              {trashLists.length === 0 ? (
                <EmptyState text="Удалённых колонок нет" />
              ) : (
                trashLists.map((list) => (
                  <div key={list.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="truncate text-sm font-medium text-slate-800">{list.title}</span>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => handleRestoreList(list)} className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-200">
                        <RotateCcw size={13} />
                        Восстановить
                      </button>
                      <button onClick={() => handlePermanentDeleteList(list.id)} className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200">
                        <X size={13} />
                        Навсегда
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
      <Trash2 size={32} strokeWidth={1.2} />
      <p className="text-sm">{text}</p>
    </div>
  );
}