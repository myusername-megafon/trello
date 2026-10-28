"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Удаленные колонки</h2>
        {trashLists.length === 0 ? (
          <p className="text-gray-500 text-sm">Колонок в корзине нет.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {trashLists.map((list: any) => (
              <div key={list.id} className="bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{list.title}</p>
                  <p className="text-xs text-gray-500">Удалено: {new Date(list.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRestoreList(list)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                    Восстановить
                  </button>
                  <button onClick={() => handlePermanentDeleteList(list.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Удалить навсегда
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Удаленные карточки</h2>
        {trashCards.length === 0 ? (
          <p className="text-gray-500 text-sm">Карточек в корзине нет.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {trashCards.map((card: any) => (
              <div key={card.id} className="bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{card.title}</p>
                  <p className="text-xs text-gray-500">Удалено: {new Date(card.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRestoreCard(card)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                    Восстановить
                  </button>
                  <button onClick={() => handlePermanentDeleteCard(card.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Удалить навсегда
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}