"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCard } from "./sortable-card";

export function DroppableList({ list, cards }: any) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "List", list },
  });

  return (
    <div className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-[80vh]">
      <div className="p-3 font-semibold text-gray-700 bg-gray-200 rounded-t-lg flex justify-between items-center">
        <span>{list.title}</span>
        <span className="text-xs bg-gray-300 px-2 py-0.5 rounded-full">{cards.length}</span>
      </div>

      {/* Зона, куда можно бросать карточки */}
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto min-h-[50px] flex flex-col gap-2">
        <SortableContext items={cards.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card: any) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}