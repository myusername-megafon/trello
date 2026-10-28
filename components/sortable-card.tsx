"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableCard({ card, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "Card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded shadow-sm border border-gray-200 text-gray-800 text-sm hover:border-gray-300 group relative flex justify-between items-start"
    >
      {/* Зона для перетаскивания */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-1 pr-2">
        {card.title}
      </div>
      
      {/* Кнопка удаления (крестик) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Чтобы клик по крестику не запускал перетаскивание
          onDelete(card); // Передаем весь объект карточки
        }}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Отправить в корзину"
      >
        ✕
      </button>
    </div>
  );
}