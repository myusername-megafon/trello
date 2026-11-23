"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

export function SortableCard({ card, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "Card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start gap-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm transition-shadow hover:border-indigo-200 hover:shadow-md"
    >
      {/* Иконка-«ручка» перетаскивания */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing group-hover:opacity-100"
        title="Перетащить"
        aria-label="Перетащить карточку"
      >
        <GripVertical size={14} />
      </button>

      {/* Текст карточки — тоже зона перетаскивания */}
      <div
        {...attributes}
        {...listeners}
        className="flex-1 cursor-grab touch-none whitespace-pre-wrap break-words pr-1 leading-snug active:cursor-grabbing"
      >
        {card.title}
      </div>

      {/* Кнопка удаления (в корзину) */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card);
        }}
        className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
        title="Отправить карточку в корзину"
        aria-label="Удалить карточку"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
