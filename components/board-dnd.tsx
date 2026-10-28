"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { DroppableList } from "./droppable-list";

export function BoardDnd({ initialLists, initialCards, boardId }: any) {
const [lists, setLists] = useState(initialLists.map((l: any) => ({ ...l, id: `list-${l.id}`, dbId: l.id })));
const [cards, setCards] = useState(initialCards.map((c: any) => ({ ...c, id: `card-${c.id}`, dbId: c.id })));
  const [activeCard, setActiveCard] = useState<any>(null);
  
  // Состояние для формы добавления колонки
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // 1. Добавление колонки (без перезагрузки!)
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("lists")
      .insert({ board_id: boardId, title: newListTitle, position: lists.length })
      .select()
      .single();

    if (error) {
      alert("Ошибка: " + error.message);
    } else if (data) {
      setLists([...lists, { ...data, id: `list-${data.id}`, dbId: data.id }]); // Мгновенно добавляем в UI
      setNewListTitle("");
      setIsAddingList(false);
    }
    setIsSubmitting(false);
  };

  // 2. Добавление карточки (без перезагрузки!)
  const handleAddCard = async (listId: number, title: string) => {
    const { data, error } = await supabase
      .from("cards")
      .insert({ list_id: listId, title: title, position: 0 })
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

  // 3. Логика перетаскивания
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

    if (isActiveACard && isOverACard) {
      setCards((cards: any[]) => {
        const activeIndex = cards.findIndex((c) => c.id === activeId);
        const overIndex = cards.findIndex((c) => c.id === overId);
        return arrayMove(cards, activeIndex, overIndex);
      });
    }

    if (isActiveACard && isOverAList) {
      const newListId = overId;
      setCards((prevCards: any[]) => 
        prevCards.map((card) => 
          card.id === activeId ? { ...card, list_id: newListId } : card
        )
      );

      await supabase
        .from("cards")
        .update({ list_id: newListId })
        .eq("id", cards.find((c: any) => c.id === activeId)?.dbId);
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
              cards={cards.filter((c: any) => c.list_id === list.id)}
              onAddCard={handleAddCard} // Передаем функцию добавления карточки
            />
          ))}
        </SortableContext>

        {/* Форма добавления колонки */}
        <div className="w-72 flex-shrink-0">
          {isAddingList ? (
            <form onSubmit={handleAddList} className="bg-gray-100 rounded-lg p-3 flex flex-col gap-2">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Название колонки..."
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                  {isSubmitting ? "..." : "Добавить"}
                </button>
                <button type="button" onClick={() => setIsAddingList(false)} className="text-gray-500 hover:text-gray-700 text-sm px-2">
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsAddingList(true)} className="bg-white/30 hover:bg-white/40 text-white w-full p-3 rounded-lg text-left transition-colors font-medium">
              + Добавить колонку
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="bg-white p-3 rounded shadow-lg border border-blue-500 text-gray-800 text-sm opacity-90 cursor-grabbing">
            {activeCard.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}