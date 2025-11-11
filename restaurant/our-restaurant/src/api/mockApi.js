const mockRestaurants = [
    {
        id: 1,
        name: '명동교자 본점',
        category: '한식 (칼국수)',
        address: '서울 중구 명동10길 29',
        coords: [126.9843, 37.5641], // Lon, Lat
        comments: [
            { id: 1, author: '김철수', rating: 5, text: '역시 명불허전! 칼국수랑 마늘김치 최고예요.' },
            { id: 2, author: '이영희', rating: 4, text: '사람이 너무 많아서 기다렸지만 맛있었어요.' },
        ]
    },
    {
        id: 2,
        name: '남산돈까스',
        category: '경양식',
        address: '서울 중구 소파로 23',
        coords: [126.9880, 37.5540],
        comments: [
            { id: 3, author: '박지성', rating: 3, text: '그냥 평범한 돈까스 맛. 경치가 좋아요.' },
        ]
    },
    {
        id: 3,
        name: '광장시장 순희네빈대떡',
        category: '한식 (분식)',
        address: '서울 종로구 종로32길 5',
        coords: [126.9995, 37.5700],
        comments: [
            { id: 4, author: '최민식', rating: 5, text: '바삭하고 고소해요! 막걸리 필수!' },
            { id: 5, author: '김혜수', rating: 4, text: '육회도 같이 먹었는데 정말 맛있습니다.' },
            { id: 6, author: '송강호', rating: 5, text: '시장 분위기 느끼면서 먹기 좋아요.' },
        ]
    }
];


// 네트워크 딜레이 시뮬레이션
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock 로그인
export const login = async (username, password) => {
    await delay(500);
    if (username === 'user' && password === 'pass1234') {
        return {
            username: 'user',
            // 실제라면 token: 'jwt-token-string...'
        };
    } else {
        throw new Error('아이디 또는 비밀번호가 틀립니다.');
    }
};

// Mock 맛집 목록 가져오기
export const fetchRestaurants = async () => {
    await delay(300);
    // 데이터베이스에서 가져온 것처럼 깊은 복사본을 반환
    return JSON.parse(JSON.stringify(mockRestaurants));
};

// Mock 댓글 추가
export const addComment = async (restaurantId, commentData, author) => {
    await delay(200);
    const newComment = {
        id: Date.now(),
        author: author,
        rating: parseInt(commentData.rating),
        text: commentData.text
    };

    // 원본 데이터(mockRestaurants)에 반영 (실제론 DB가 할 일)
    const restaurant = mockRestaurants.find(r => r.id === restaurantId);
    if (restaurant) {
        restaurant.comments.push(newComment);
        return newComment;
    } else {
        throw new Error('맛집을 찾을 수 없습니다.');
    }
};
