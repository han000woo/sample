// async function getConfig() {
//   const res = await fetch('config.json'); // 같은 서버 루트에 배치
//   const config = await res.json();
//   return config
// }
// const cfg = await getConfig()
// const API_BASE_URL = cfg.SERVER_ADDRESS
const API_BASE_URL = "http://127.0.0.1:8000/api/v1"

// 사용자 API 

// 댓글 API
/**
 * 모든 댓글을 API에서 가져옵니다. (GET)
 * @returns {Promise<Array>} 댓글 객체 배열
 */
export async function getComments() {
    try {        
        const response = await fetch(`${API_BASE_URL}/comments/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comments = await response.json();
        return comments;
    } catch (error) {
        console.error("댓글을 불러오는 데 실패했습니다:", error);
        // 실제 앱에서는 사용자에게 오류를 알리는 UI를 보여주는 것이 좋습니다.
        return []; // 오류 발생 시 빈 배열 반환
    }
}

/**
 * 댓글을 추가합니다 (Post)
 * @returns {Promise<Object>} 댓글 객체 배열
 */
export async function addComments(data) {
    const token = localStorage.getItem("access_token");

    try {

        const response = await fetch(`${API_BASE_URL}/comments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // <- 꼭 있어야 함
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comments = await response.json();
        return comments;
    } catch (error) {
        console.error("댓글을 불러오는 데 실패했습니다:", error);
        // 실제 앱에서는 사용자에게 오류를 알리는 UI를 보여주는 것이 좋습니다.
        return []; // 오류 발생 시 빈 배열 반환
    }
}

/**
 * 특정 댓글을 수정합니다. (PATCH)
 * @param {number} id - 수정할 댓글의 ID
 * @param {object} data - 수정할 데이터 (예: { text: "새 내용" })
 * @returns {Promise<object>} 수정된 댓글 객체
 */
export async function patchComment(id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedComment = await response.json();
        console.log(`Comment ${id}가 수정되었습니다.`);
        return updatedComment;

    } catch (error) {
        console.error("댓글 수정에 실패했습니다:", error);
        throw error; // 오류를 상위로 전파
    }
}

/**
 * 특정 댓글을 삭제합니다. (DELETE)
 * @param {number} id - 삭제할 댓글의 ID
 * @returns {Promise<object>} 삭제된 댓글 객체 (백엔드 응답에 따라 다름)
 */
export async function removeComment(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 백엔드가 삭제된 객체를 반환한다고 가정
        const deletedComment = await response.json();
        console.log(`Comment ${id}가 삭제되었습니다.`);
        return deletedComment;

    } catch (error) {
        console.error("댓글 삭제에 실패했습니다:", error);
        throw error; // 오류를 상위로 전파
    }
}

/**
 * 태그 리스트를 가져옵니다(GET)
 * @returns {Promise<object>} 태그 리스트
 */
export async function getTags() {
    try {
        const response = await fetch(`${API_BASE_URL}/tags`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 백엔드가 삭제된 객체를 반환한다고 가정
        const tags = await response.json();
        console.log(tags);
        return tags
    } catch (error) {
        console.log("태그를 가져오는데 실패", error);
        throw error; // 오류를 상위로 전파
    }
}
