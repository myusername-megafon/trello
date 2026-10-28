import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { BoardDnd } from "@/components/board-dnd"; 

async function BoardContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id: boardId } = await paramsPromise;
  const supabase = await createClient();

  // Получаем доску
  const { data: board, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (error || !board) {
    return <div className="text-white p-6">Доска не найдена.</div>;
  }

  // Получаем колонки
  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  // Получаем ВСЕ карточки для этих колонок
  let cards: any[] = [];
  if (lists && lists.length > 0) {
    const listIds = lists.map((l) => l.id);
    const { data: cardsData } = await supabase
      .from("cards")
      .select("*")
      .in("list_id", listIds)
      .order("position", { ascending: true });
    if (cardsData) cards = cardsData;
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white px-6 pt-4">{board.title}</h1>
            <div className="p-6 flex-1 flex items-start overflow-x-auto">
        {/* Передаем данные в DnD-компонент */}
        <BoardDnd 
          initialLists={lists || []} 
          initialCards={cards || []} 
          boardId={boardId} 
        />
      </div>
    </>
  );
}

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-screen bg-blue-500 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 flex items-center shadow-md">
        <Link href="/" className="hover:underline text-sm bg-blue-700 px-3 py-1 rounded mr-4">
          ← Назад к доскам
        </Link>
      </nav>
      <Suspense fallback={<p className="text-white p-6">Загрузка доски...</p>}>
        <BoardContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}