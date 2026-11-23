"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";

export function TrashClient({ initialTrashLists, initialTrashCards }: any) {
  const [trashLists, setTrashLists] = useState(initialTrashLists);
  const [trashCards, setTrashCards] = useState(initialTrashCards);
  const supabase = createClient();
  const router = useRouter();

  // Восстановление КАРТОЧКИ
  const handleRestoreCard = async (card: any) => {
    // Проверяем, существует ли колонка, в которую мы хотим вернуть карточку
    const { data: listExists } = await supabase
      .from("lists")
      .select("id")
      .eq("id", card.list_id)
      .single();

    if (!listExists) {
      alert("Невозможно восстановить: колонка, в которой была эта карточка, также удалена. Сначала восстановите колонку.");
      return;
    }

    // Вставляем обратно в cards
    const { error } = await supabase.from("cards").insert({
      id: card.original_id,
      list_id: card.list_id,
      title: card.title,
      description: card.description,
      position: card.position,
    });

    if (error) {
      alert("Ошибка восстановления: " + error.message);
      return;
    }

    // Удаляем из корзины
    await supabase.from("trash_cards").delete().eq("id", card.id);
    setTrashCards((prev: any) => prev.filter((c: any) => c.id !== card.id));
  };

  // Восстановление КОЛОНКИ (и её карточек)
  const handleRestoreList = async (list: any) => {
    // 1. Восстанавливаем колонку
    const { error: listError } = await supabase.from("lists").insert({
      id: list.original_id,
      board_id: list.board_id,
      title: list.title,
      position: list.position,
    });

    if (listError) {
      alert("Ошибка восстановления колонки: " + listError.message);
      return;
    }

    // 2. Находим все карточки, которые были в этой колонке и тоже лежат в корзине
    const cardsToRestore = trashCards.filter((c: any) => c.list_id === list.original_id);

    // 3. Восстанавливаем эти карточки
    if (cardsToRestore.length > 0) {
      const cardsData = cardsToRestore.map((c: any) => ({
        id: c.original_id,
        list_id: c.list_id,
        title: c.title,
        description: c.description,
        position: c.position,
      }));

      await supabase.from("cards").insert(cardsData);
      
      // Удаляем восстановленные карточки из корзины
      const cardIdsToRemove = cardsToRestore.map((c: any) => c.id);
      await supabase.from("trash_cards").delete().in("id", cardIdsToRemove);
      
      // Обновляем стейт карточек
      setTrashCards((prev: any) => prev.filter((c: any) => !cardIdsToRemove.includes(c.id)));
    }

    // 4. Удаляем колонку из корзины
    await supabase.from("trash_lists").delete().eq("id", list.id);
    setTrashLists((prev: any) => prev.filter((l: any) => l.id !== list.id));
  };

  // ПОЛНОЕ УДАЛЕНИЕ (безвозвратно)
  const handlePermanentDeleteCard = async (id: number) => {
    if (!confirm("Удалить карточку навсегда? Это действие нельзя отменить.")) return;
    await supabase.from("trash_cards").delete().eq("id", id);
    setTrashCards((prev: any) => prev.filter((c: any) => c.id !== id));
  };

  const handlePermanentDeleteList = async (id: number) => {
    if (!confirm("Удалить колонку и все её карточки навсегда?")) return;
    await supabase.from("trash_lists").delete().eq("id", id);
    setTrashLists((prev: any) => prev.filter((l: any) => l.id !== id));
    
    // На всякий случай удаляем карточки этой колонки
    await supabase.from("trash_cards").delete().eq("list_id", id);
    setTrashCards((prev: any) => prev.filter((c: any) => c.list_id !== id));
  };

  return (
    <div className="flex flex-col gap-8">
      <TrashSection
        title="Удалённые колонки"
        empty="Колонок в корзине нет."
        items={trashLists}
        renderItem={(list) => ({
          title: list.title,
          deletedAt: list.deleted_at,
          onRestore: () => handleRestoreList(list),
          onDelete: () => handlePermanentDeleteList(list.id),
        })}
      />

      <TrashSection
        title="Удалённые карточки"
        empty="Карточек в корзине нет."
        items={trashCards}
        renderItem={(card) => ({
          title: card.title,
          deletedAt: card.deleted_at,
          onRestore: () => handleRestoreCard(card),
          onDelete: () => handlePermanentDeleteCard(card.id),
        })}
      />
    </div>
  );
}

function TrashSection({
  title,
  empty,
  items,
  renderItem,
}: {
  title: string;
  empty: string;
  items: any[];
  renderItem: (item: any) => {
    title: string;
    deletedAt: string;
    onRestore: () => void;
    onDelete: () => void;
  };
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
        {title}
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const { title: itemTitle, deletedAt, onRestore, onDelete } = renderItem(item);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{itemTitle}</p>
                  <p className="text-xs text-slate-500">
                    Удалено: {new Date(deletedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={onRestore}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
                  >
                    <RotateCcw size={14} />
                    Восстановить
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
                  >
                    <X size={14} />
                    Навсегда
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
