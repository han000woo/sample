import React from "react";
import { Post } from "../types/post";

interface PostListProps {
    posts: Post[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>조회수</th>
                </tr>
            </thead>
            <tbody>
                {/* map() 함수를 이용해 게시글 목록을 반복 렌더링 */}
                {posts.map((post) => (
                    // key prop은 React에서 목록 렌더링 시 필수입니다.
                    <tr key={post.id}>
                        <td>{post.id}</td>
                        {/* post는 Post 타입이므로 .title, .author 등을 사용할 때 자동완성되고 오타를 방지합니다. */}
                        <td><a href={`/post/${post.id}`}>{post.title}</a></td>
                        <td>{post.author}</td>
                        <td>{post.views}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}