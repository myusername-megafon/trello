import { AuthButton } from "@/components/auth-button";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CreateBoardForm } from "@/components/create-board-form";
import Link from "next/link";

// 1. Компонент для загрузки данных (вынесен отдельно)
async function BoardsList() {
  const supabase = await createClient();
  
  // Получаем данные пользователя (это не вызовет ошибку, т.к. мы внутри Suspense)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-red-500">Ошибка авторизации. Пожалуйста, войдите снова.</p>;
  }

  // Получаем доски
  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .order("id", { ascending: true });

  if (!boards || boards.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500 mb-4">У вас пока нет досок.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Создать первую доску
        </button>
      </div>
    );
  }

  return (
  <div className="flex gap-6 items-start">
    {boards.map((board) => (
      <Link 
        href={`/board/${board.id}`} 
        key={board.id} 
        className="bg-white p-4 rounded-lg shadow min-w-[250px] block hover:shadow-lg transition-shadow"
      >
        <h3 className="font-bold text-lg mb-2 text-gray-800">{board.title}</h3>
      </Link>
    ))}
  </div>
); 
}

// 2. Основной компонент страницы (отрисуется мгновенно)
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Шапка */}
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Trello Clone</h1>
        </div>
        <Suspense fallback={<div className="w-20 h-8 bg-blue-500 animate-pulse rounded"></div>}>
          <AuthButton />
          <Link href="/trash" className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition-colors">
            Корзина
          </Link>
        </Suspense>
      </nav>

      {/* Контент */}
      <div className="p-8 flex-1 overflow-x-auto">

      {/* Добавляем форму сюда */}
        <div className="mb-6">
          <CreateBoardForm />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700">Мои доски</h2>
        
        {/* Оборачиваем загрузку досок в Suspense */}
        <Suspense fallback={<p className="text-gray-500 animate-pulse">Загрузка ваших досок...</p>}>
          <BoardsList />
        </Suspense>
      </div> 
    </main>
  );
}