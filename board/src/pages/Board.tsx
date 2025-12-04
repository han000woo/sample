import React, { useState } from "react";
import type { Post } from "../types/post";

const MOCK_DATA: Post[] = [
    { id: 1, title: 'TypeScript를 써봅시다', content: '타입이 명확해서 좋네요.', author: '홍길동', date: '2023-10-01', views: 15 },
  { id: 2, title: 'React 게시판 시작', content: '목록 출력부터 해보겠습니다.', author: '김철수', date: '2023-10-05', views: 22 },
  { id: 3, title: '환경 설정 완료', content: 'Vite로 쉽게 설정했어요.', author: '이영희', date: '2023-10-10', views: 5 },
]

export default function Board() {
    // useState에 Post[] 타입을 명시적으로 지정하여 상태관리
    const [posts, setPosts] = useState<Post[]>(MOCK_DATA)
    return (
        <div>
            <h1>게시판 목록 ( 총{posts.length}개)</h1>
            <PostList posts={posts}/>
        </div>
    )
}