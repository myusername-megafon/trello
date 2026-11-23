"use client";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { SortableCard } from "./sortable-card";

export function DroppableList({ list, cards, onAddCard, onDeleteCard, onDeleteList }: any) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "List", list },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const success = await onAddCard(list.id, title);
    if (success) {
      setTitle("");
      // Колонка остаётся в режиме добавления — можно быстро добавлять дальше.
      // Свернуть форму можно кнопкой «Отмена» или Escape.
    }
    setLoading(false);
  };

  return (
    <div className="flex max-h-[80vh] w-72 flex-shrink-0 flex-col rounded-xl bg-white/95 shadow-lg backdrop-blur">
      {/* Шапка колонки */}
      <div className="group flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="truncate font-semibold text-slate-700">{list.title}</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {cards.length}
          </span>

          {/* Кнопка удаления колонки (в корзину) */}
          <button
            onClick={() => onDeleteList(list)}
            className="rounded p-1 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            title="Отправить колонку в корзину"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div ref={setNodeRef} className="nice-scroll flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto p-3">
        <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card: any) => (
            <SortableCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>

        {/* Форма добавления карточки */}
        {isAdding ? (
          <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setTitle("");
                }
              }}
              placeholder="Название карточки… (Enter — добавить)"
              rows={2}
              className="resize-none rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              autoFocus
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "…" : "Добавить"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setTitle("");
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="dashed-drop mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:text-slate-800"
          >
            <Plus size={16} />
            Добавить карточку
          </button>
        )}
      </div>
    </div>
  );
}
