import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddListForm } from "@/components/add-list-form";

// 1. Дочерний компонент получает Promise<params> и ждёт его ВНУТРИ
async function BoardContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id: boardId } = await paramsPromise; // await здесь безопасен
  const supabase = await createClient();

  const { data: board, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (error || !board) {
    return (
      <div className="text-white p-6">
        <p>Доска не найдена или нет доступа.</p>
        <p className="text-sm opacity-70">ID: {boardId} | Ошибка: {error?.message || "Нет данных"}</p>
      </div>
    );
  }

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  return (
    <>
      <h1 className="text-2xl font-bold text-white px-6 pt-4">{board.title}</h1>
      <div className="p-6 flex-1 flex gap-4 items-start overflow-x-auto">
        {lists && lists.length > 0 ? (
          lists.map((list) => (
            <div key={list.id} className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full">
              <div className="p-3 font-semibold text-gray-700 bg-gray-200 rounded-t-lg">{list.title}</div>
              <div className="p-3 flex-1 overflow-y-auto min-h-[50px]">
                <p className="text-xs text-gray-400 italic">Пока пусто...</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white bg-blue-400 p-4 rounded-lg">В этой доске пока нет колонок.</p>
        )}
        <AddListForm boardId={boardId} currentListsCount={lists?.length || 0} />
      </div>
    </>
  );
}

// 2. Основная страница СИНХРОННАЯ. Она только передаёт Promise дальше
export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-screen bg-blue-500 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 flex items-center shadow-md">
        <Link href="/" className="hover:underline text-sm bg-blue-700 px-3 py-1 rounded mr-4">
          ← Назад к доскам
        </Link>
      </nav>

      {/* 3. Suspense оборачивает дочерний компонент */}
      <Suspense fallback={<p className="text-white p-6">Загрузка доски...</p>}>
        <BoardContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}