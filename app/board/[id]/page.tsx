import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BoardDnd } from "@/components/board-dnd";
import { ArrowLeft, Loader2 } from "lucide-react";

async function BoardContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id: boardId } = await paramsPromise;
  const supabase = await createClient();

  const { data: board, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (error || !board) {
    return (
      <div className="p-6 text-white/90">
        Доска не найдена.{" "}
        <Link href="/" className="underline hover:text-white">
          Вернуться к списку досок
        </Link>
      </div>
    );
  }

  const { data: lists } = await supabase
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

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
      <h1 className="px-6 pt-4 text-2xl font-bold tracking-tight text-white drop-shadow-sm">
        {board.title}
      </h1>
      <div className="nice-scroll flex-1 overflow-x-auto p-6">
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
    <main className="board-gradient flex min-h-screen flex-col">
      <nav className="glass sticky top-0 z-10 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-none items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            <ArrowLeft size={16} />
            К доскам
          </Link>
        </div>
      </nav>

      <Suspense
        fallback={
          <p className="flex items-center gap-2 p-6 text-white/80">
            <Loader2 className="animate-spin" size={18} />
            Загрузка доски…
          </p>
        }
      >
        <BoardContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
