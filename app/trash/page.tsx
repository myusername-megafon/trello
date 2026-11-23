import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TrashClient } from "@/components/trash-client";

async function TrashContent() {
  const supabase = await createClient();

  const [{ data: trashLists }, { data: trashCards }] = await Promise.all([
    supabase.from("trash_lists").select("*").order("deleted_at", { ascending: false }),
    supabase.from("trash_cards").select("*").order("deleted_at", { ascending: false }),
  ]);

  return (
    <TrashClient
      initialTrashLists={trashLists || []}
      initialTrashCards={trashCards || []}
    />
  );
}

export default function TrashPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft size={16} />
            К доскам
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Общая корзина</h1>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <p className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          Здесь хранятся удалённые колонки и карточки со всех досок. Удобнее
          управлять корзиной прямо на странице нужной доски — кнопка «Корзина
          доски».
        </p>
        <Suspense
          fallback={
            <p className="flex items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Загрузка корзины…
            </p>
          }
        >
          <TrashContent />
        </Suspense>
      </div>
    </main>
  );
}
