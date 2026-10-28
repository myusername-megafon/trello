"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SortableCard } from "./sortable-card";
import { DroppableList } from "./droppable-list";
import { AddListForm } from "./add-list-form";

export function BoardDnd({ initialLists, initialCards, boardId }: any) {
  const [lists, setLists] = useState(initialLists);
  const [cards, setCards] = useState(initialCards);
  const [activeCard, setActiveCard] = useState<any>(null); // Карточка, которую сейчас тащат
  
  const supabase = createClient();
  const router = useRouter();

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

    // Если бросили на то же место
    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";
    const isOverAList = over.data.current?.type === "List";

    if (!isActiveACard) return; // Пока поддерживаем только перетаскивание карточек

    // 1. Перетаскивание карточки на другую карточку
    if (isActiveACard && isOverACard) {
      setCards((cards: any[]) => {
        const activeIndex = cards.findIndex((c) => c.id === activeId);
        const overIndex = cards.findIndex((c) => c.id === overId);
        
        // Меняем местами в локальном состоянии
        return arrayMove(cards, activeIndex, overIndex);
      });

      // В будущем здесь будет обновление position в базе, 
      // но для простоты MVP можно пока не сохранять порядок, 
      // а только менять колонку.
    }

    // 2. Перетаскивание карточки в пустую колонку или в конец колонки
    if (isActiveACard && isOverAList) {
      const newListId = overId;
      
      // Обновляем в локальном состоянии
      setCards((prevCards: any[]) => 
        prevCards.map((card) => 
          card.id === activeId ? { ...card, list_id: newListId } : card
        )
      );

      // Сохраняем в базу данных
      const { error } = await supabase
        .from("cards")
        .update({ list_id: newListId })
        .eq("id", activeId);

      if (error) {
        console.error("Ошибка при перемещении:", error);
        alert("Не удалось переместить карточку");
        router.refresh(); // Откатываем к состоянию из базы
      }
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start">
        <SortableContext items={lists.map((l: any) => l.id)}>
          {lists.map((list: any) => (
            <DroppableList 
              key={list.id} 
              list={list} 
              cards={cards.filter((c: any) => c.list_id === list.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Визуальная тень, которая летит за курсором */}
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