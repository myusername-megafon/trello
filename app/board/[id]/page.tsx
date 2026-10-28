import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddListForm } from "@/components/add-list-form";
import { ListColumn } from "@/components/list-column";

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
      <div className="p-6 flex-1 flex gap-4 items-start overflow-x-auto">
        {lists && lists.length > 0 ? (
          lists.map((list) => {
            // Фильтруем карточки, чтобы отдать компоненту только те, что принадлежат этой колонке
            const listCards = cards.filter((c) => c.list_id === list.id);
            return <ListColumn key={list.id} list={list} initialCards={listCards} />;
          })
        ) : (
          <p className="text-white bg-blue-400 p-4 rounded-lg">В этой доске пока нет колонок.</p>
        )}
        <AddListForm boardId={boardId} currentListsCount={lists?.length || 0} />
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