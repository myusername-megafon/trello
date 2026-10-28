import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrashClient } from "@/components/trash-client";

async function TrashContent() {
  const supabase = await createClient();

  // Получаем все удаленные колонки
  const { data: trashLists } = await supabase
    .from("trash_lists")
    .select("*")
    .order("deleted_at", { ascending: false });

  // Получаем все удаленные карточки
  const { data: trashCards } = await supabase
    .from("trash_cards")
    .select("*")
    .order("deleted_at", { ascending: false });

  return (
    <TrashClient 
      initialTrashLists={trashLists || []} 
      initialTrashCards={trashCards || []} 
    />
  );
}

export default function TrashPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-gray-800 text-white p-4 flex items-center shadow-md">
        <Link href="/" className="hover:underline text-sm bg-gray-700 px-3 py-1 rounded mr-4">
          ← Назад к доскам
        </Link>
        <h1 className="text-xl font-bold">Корзина</h1>
      </nav>

      <div className="p-6 flex-1 overflow-auto">
        <Suspense fallback={<p className="text-gray-500">Загрузка корзины...</p>}>
          <TrashContent />
        </Suspense>
      </div>
    </main>
  );
}