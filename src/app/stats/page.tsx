"use client";

import Link from "next/link";
import { useRestaurants } from "@/hooks";
import { CATEGORIES } from "@/constants";

export default function StatsPage() {
  const { data: restaurants = [], isLoading } = useRestaurants();

  // 총 방문 횟수
  const totalVisits = restaurants.reduce((sum, r) => sum + r.visitCount, 0);

  // 카테고리별 통계
  const categoryStats = CATEGORIES.map((category) => {
    const categoryRestaurants = restaurants.filter((r) => r.category === category);
    const count = categoryRestaurants.length;
    const visits = categoryRestaurants.reduce((sum, r) => sum + r.visitCount, 0);
    return { category, count, visits };
  }).filter((stat) => stat.count > 0);

  // 가장 많이 방문한 가게 Top 5
  const topRestaurants = [...restaurants]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5);

  // 평균 별점이 높은 가게 Top 5
  const topRatedRestaurants = [...restaurants]
    .filter((r) => r.averageRating !== null)
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center px-4 py-3 lg:px-6">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">통계</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-sky-500">{restaurants.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">등록 가게</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-sky-500">{totalVisits}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">총 방문</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-sky-500">{categoryStats.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">카테고리</p>
          </div>
        </div>

        {/* 카테고리별 분포 */}
        {categoryStats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">카테고리별 분포</h2>
            <div className="space-y-3">
              {categoryStats
                .sort((a, b) => b.count - a.count)
                .map((stat) => {
                  const percentage = (stat.count / restaurants.length) * 100;
                  return (
                    <div key={stat.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{stat.category}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {stat.count}곳 · {stat.visits}회 방문
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 가장 많이 방문한 가게 */}
        {topRestaurants.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🔥 자주 가는 가게
            </h2>
            <div className="space-y-3">
              {topRestaurants.map((restaurant, index) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.id}`}
                  className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="w-6 h-6 bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {restaurant.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {restaurant.category}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-sky-500">
                    {restaurant.visitCount}회
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 별점 높은 가게 */}
        {topRatedRestaurants.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⭐ 별점 높은 가게
            </h2>
            <div className="space-y-3">
              {topRatedRestaurants.map((restaurant, index) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.id}`}
                  className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {restaurant.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {restaurant.category}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-yellow-500">
                    ★ {restaurant.averageRating?.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              아직 통계가 없어요
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              가게를 등록하고 방문 기록을 남겨보세요
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              가게 등록하러 가기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
