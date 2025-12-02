import { fetchPosts } from "@/api/post";
import { QUERY_KEYS } from "@/lib/constants";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 5;

export function useInfinitePostsData(authorId?: string) {
  const queryClient = useQueryClient();

  return useInfiniteQuery({
    queryKey: !authorId
      ? QUERY_KEYS.post.list
      : QUERY_KEYS.post.userList(authorId),
    queryFn: async ({ pageParam }) => {
      const response = await fetchPosts({
        page: pageParam,
        limit: PAGE_SIZE,
        authorId,
      });

      // 각 포스트를 개별 쿼리 캐시에 저장
      response.items.forEach((post) => {
        queryClient.setQueryData(QUERY_KEYS.post.byId(post.id), post);
      });

      // 포스트 ID 배열과 메타 정보 반환
      return {
        postIds: response.items.map((post) => post.id),
        hasNext: response.meta.hasNext,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // hasNext가 false면 undefined 반환 (더 이상 페이지 없음)
      if (!lastPage.hasNext) return undefined;
      // 다음 페이지 번호 반환
      return allPages.length + 1;
    },
    staleTime: Infinity,
  });
}
