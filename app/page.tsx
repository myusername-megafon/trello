import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { HeaderActions } from "@/components/header-actions";
import { CreateBoardForm } from "@/components/create-board-form";

const GRADIENTS = [
  "bg-grad-1",
  "bg-grad-2",
  "bg-grad-3",
  "bg-grad-4",
  "bg-grad-5",
  "bg-grad-6",
  "bg-grad-7",
  "bg-grad-8",
];

async function BoardsList() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .order("id", { ascending: true });

  if (!boards || boards.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-white/30 bg-white/10 p-10 text-center backdrop-blur">
        <LayoutGrid className="mx-auto mb-3 text-white/60" size={40} />
        <p className="text-lg font-medium text-white/90">У вас пока нет досок</p>
        <p className="mt-1 text-sm text-white/60">
          Создайте первую доску — поле ввода выше ↑
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board, i) => (
        <Link
          key={board.id}
          href={`/board/${board.id}`}
          className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
        >
          <div
            className={`${
              GRADIENTS[i % GRADIENTS.length]
            } h-24 w-full transition-transform duration-300 group-hover:scale-[1.03]`}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="truncate font-semibold text-gray-800">
              {board.title}
            </h3>
            <span className="text-sm text-gray-400 transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Считаем содержимое общей корзины, чтобы показывать бейдж только когда там что-то есть.
  // Основная работа с корзиной идёт на уровне доски — эта страница лишь общий вход.
  const [{ count: listsCount }, { count: cardsCount }] = await Promise.all([
    supabase.from("trash_lists").select("id", { count: "exact", head: true }),
    supabase.from("trash_cards").select("id", { count: "exact", head: true }),
  ]);

  const trashCount = (listsCount ?? 0) + (cardsCount ?? 0);

  return (
    <main className="board-gradient flex min-h-screen flex-col">
      {/* Шапка */}
      <nav className="glass sticky top-0 z-10 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg font-black text-white shadow-inner">
              T
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              TaskBoard
            </h1>
          </div>

          <HeaderActions email={user.email ?? undefined} trashCount={trashCount} />
        </div>
      </nav>

      {/* Контент */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8">
          <CreateBoardForm />
        </div>

        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
          <LayoutGrid size={18} />
          Мои доски
        </h2>

        <Suspense
          fallback={
            <div className="animate-pulse text-white/70">
              Загрузка ваших досок…
            </div>
          }
        >
          <BoardsList />
        </Suspense>
      </div>
    </main>
  );
}
