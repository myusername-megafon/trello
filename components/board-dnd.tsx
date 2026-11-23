"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { DroppableList } from "./droppable-list";
import { BoardTrashModal } from "./board-trash-modal";

export function BoardDnd({ initialLists, initialCards, boardId }: any) {
  const [lists, setLists] = useState(() => 
    initialLists.map((l: any) => ({ ...l, id: `list-${l.id}`, dbId: l.id }))
  );
  const [cards, setCards] = useState(() => 
    initialCards.map((c: any) => ({ ...c, id: `card-${c.id}`, dbId: c.id }))
  );
  
  const [activeCard, setActiveCard] = useState<any>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const supabase = createClient();

  // --- ДОБАВЛЕНИЕ ---
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    setIsSubmitting(true);
    const realBoardId = parseInt(boardId, 10);

    const { data, error } = await supabase
      .from("lists")
      .insert({ board_id: realBoardId, title: newListTitle, position: lists.length })
      .select()
      .single();

    if (error) {
      alert("Ошибка: " + error.message);
    } else if (data) {
      setLists([...lists, { ...data, id: `list-${data.id}`, dbId: data.id }]);
      setNewListTitle("");
      setIsAddingList(false);
    }
    setIsSubmitting(false);
  };

  const handleAddCard = async (listId: string, title: string) => {
    const realListId = parseInt(listId.replace("list-", ""), 10);

    const { data, error } = await supabase
      .from("cards")
      .insert({ list_id: realListId, title: title, position: 0 })
      .select()
      .single();

    if (error) {
      alert("Ошибка: " + error.message);
      return false;
    }
    if (data) {
      setCards([...cards, { ...data, id: `card-${data.id}`, dbId: data.id }]);
      return true;
    }
    return false;
  };

  // --- АРХИВАЦИЯ (В КОРЗИНУ) ---
  const handleDeleteCard = async (card: any) => {
    if (!confirm("Отправить карточку в корзину?")) return;
    
    // 1. Копируем в архив
    const { error: trashError } = await supabase.from("trash_cards").insert({
      original_id: card.dbId,
      list_id: card.list_id,
      title: card.title,
      description: card.description || null,
      position: card.position || 0,
    });

    if (trashError) {
      alert("Ошибка при архивации: " + trashError.message);
      return;
    }

    // 2. Удаляем из основной таблицы
    const { error: deleteError } = await supabase.from("cards").delete().eq("id", card.dbId);
    
    if (deleteError) {
      alert("Ошибка при удалении: " + deleteError.message);
    } else {
      setCards((prev: any) => prev.filter((c: any) => c.dbId !== card.dbId));
    }
  };

  const handleDeleteList = async (list: any) => {
    if (!confirm("Отправить колонку и все её карточки в корзину?")) return;
    
    // 1. Находим все карточки этой колонки
    const listCards = cards.filter((c: any) => c.list_id === list.dbId);

    // 2. Копируем колонку в архив
    const { error: trashListError } = await supabase.from("trash_lists").insert({
      original_id: list.dbId,
      board_id: boardId,
      title: list.title,
      position: list.position || 0,
    });

    if (trashListError) {
      alert("Ошибка при архивации колонки: " + trashListError.message);
      return;
    }

    // 3. Копируем все карточки этой колонки в архив
    if (listCards.length > 0) {
      const cardsToTrash = listCards.map((c: any) => ({
        original_id: c.dbId,
        list_id: c.list_id,
        title: c.title,
        description: c.description || null,
        position: c.position || 0,
      }));

      const { error: trashCardsError } = await supabase.from("trash_cards").insert(cardsToTrash);
      if (trashCardsError) {
        alert("Ошибка при архивации карточек: " + trashCardsError.message);
        return;
      }
    }

    // 4. Удаляем колонку (карточки удалятся каскадно)
    const { error: deleteError } = await supabase.from("lists").delete().eq("id", list.dbId);
    
    if (deleteError) {
      alert("Ошибка при удалении колонки: " + deleteError.message);
    } else {
      setLists((prev: any) => prev.filter((l: any) => l.dbId !== list.dbId));
setCards((prev: any) => prev.filter((c: any) => c.list_id !== list.dbId));
    }
  };

  // --- ПЕРЕТАСКИВАНИЕ ---
  const handleDragStart = (event: any) => {
    const { active } = event;
    const card = cards.find((c: any) => c.id === active.id);
    setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";
    const isOverAList = over.data.current?.type === "List";

    if (!isActiveACard) return;

    if (isOverACard) {
      setCards((prevCards: any[]) => {
        const activeIndex = prevCards.findIndex((c: any) => c.id === activeId);
        const overIndex = prevCards.findIndex((c: any) => c.id === overId);
        
        const activeCard = prevCards[activeIndex];
        const overCard = prevCards[overIndex];
        
        if (activeCard.list_id !== overCard.list_id) {
          const newCards = [...prevCards];
          newCards[activeIndex] = { ...activeCard, list_id: overCard.list_id };
          return arrayMove(newCards, activeIndex, overIndex);
        }
        return arrayMove(prevCards, activeIndex, overIndex);
      });

      const activeCard = cards.find((c: any) => c.id === activeId);
      const overCard = cards.find((c: any) => c.id === overId);
      
      if (activeCard && overCard && activeCard.list_id !== overCard.list_id) {
         await supabase.from("cards").update({ list_id: overCard.list_id }).eq("id", activeCard.dbId);
      }
    }

    if (isOverAList) {
      const newListIdStr = String(over.id);
      const realListId = parseInt(newListIdStr.replace("list-", ""), 10);
      
      setCards((prevCards: any[]) => 
        prevCards.map((card: any) => 
          card.id === activeId ? { ...card, list_id: realListId } : card
        )
      );

      const activeCard = cards.find((c: any) => c.id === activeId);
      if (activeCard) {
        await supabase.from("cards").update({ list_id: realListId }).eq("id", activeCard.dbId);
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 items-start">
        <SortableContext items={lists.map((l: any) => l.id)}>
          {lists.map((list: any) => (
            <DroppableList
              key={list.id}
              list={list}
              cards={cards.filter((c: any) => c.list_id === list.dbId)}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onDeleteList={handleDeleteList}
            />
          ))}
        </SortableContext>

        <div className="w-72 flex-shrink-0">
          {isAddingList ? (
            <form onSubmit={handleAddList} className="flex flex-col gap-2 rounded-xl bg-slate-100 p-3 shadow-lg">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Название колонки…"
                className="rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isSubmitting || !newListTitle.trim()} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting ? "…" : "Добавить"}
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-200">
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsAddingList(true)} className="flex w-full items-center gap-2 rounded-xl bg-white/20 p-3 text-left font-medium text-white backdrop-blur transition-colors hover:bg-white/30">
              <Plus size={18} />
              Добавить колонку
            </button>
          )}

          {/* Корзина доски — второстепенное действие под кнопкой добавления */}
          <button
            onClick={() => setIsTrashOpen(true)}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            title="Корзина этой доски"
          >
            <Trash2 size={16} />
            Корзина доски
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="bg-white p-3 rounded shadow-lg border border-blue-500 text-gray-800 text-sm opacity-90 cursor-grabbing">
            {activeCard.title}
          </div>
        ) : null}
      </DragOverlay>

      <BoardTrashModal 
  isOpen={isTrashOpen} 
  onClose={() => setIsTrashOpen(false)} 
  boardId={boardId} 
/>

    </DndContext>
  );
}