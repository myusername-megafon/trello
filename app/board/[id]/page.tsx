import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddListForm } from "@/components/add-list-form";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const boardId = params.id;

  // Получаем информацию о доске
  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (!board) {
    return notFound(); // Если доски нет или нет прав — 404
  }

  // Получаем колонки этой доски, отсортированные по позиции
  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-blue-500 flex flex-col">
      {/* Шапка доски */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:underline text-sm bg-blue-700 px-3 py-1 rounded">
            ← Назад к доскам
          </Link>
          <h1 className="text-2xl font-bold">{board.title}</h1>
        </div>
      </nav>

      {/* Контейнер для колонок (горизонтальный скролл) */}
      <div className="p-6 flex-1 flex gap-4 items-start overflow-x-auto">
        {lists && lists.length > 0 ? (
          lists.map((list) => (
            <div key={list.id} className="bg-gray-100 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full">
              <div className="p-3 font-semibold text-gray-700 bg-gray-200 rounded-t-lg">
                {list.title}
              </div>
              <div className="p-3 flex-1 overflow-y-auto min-h-[50px]">
                {/* Здесь позже будут карточки */}
                <p className="text-xs text-gray-400 italic">Пока пусто...</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white bg-blue-400 p-4 rounded-lg">В этой доске пока нет колонок.</p>
        )}

                <AddListForm boardId={boardId} currentListsCount={lists?.length || 0} />
      </div>
    </main>
  );
}