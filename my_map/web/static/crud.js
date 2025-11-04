// 게시판 항목 생성 함수 ---
function createBoardItem(comment) {
    const item = document.createElement('div');
    item.className = 'p-3 bg-white border rounded-lg shadow-sm';
    item.setAttribute('data-comment-id', comment.id);

    let content = `
                <div class="cursor-pointer" data-role="go-to-map">
                    <h3 class="font-semibold text-blue-600">${comment.text}</h3>`;

    if (comment.latitude && comment.longitude) {
        content += `<p class="text-sm text-gray-500">위치: ${comment.latitude.toFixed(4)}, ${comment.longitude.toFixed(4)}</p>`;
    } else {
        content += `<p class="text-sm text-gray-400">(위치 정보 없음)</p>`;
    }
    content += `</div>`; // .cursor-pointer

    content += `
                <div class="mt-2 pt-2 border-t flex space-x-2">
                    <button data-role="update" class="text-sm text-blue-500 hover:text-blue-700">수정</button>
                    <button data-role="delete" class="text-sm text-red-500 hover:text-red-700">삭제</button>
                </div>
            `;

    item.innerHTML = content;

    // --- 이벤트 위임 ---
    item.querySelector('[data-role="go-to-map"]').addEventListener('click', () => {
        handleBoardItemClick(comment);
    });

    item.querySelector('[data-role="update"]').addEventListener('click', (e) => {
        e.stopPropagation();
        handleUpdateClick(comment);
    });

    item.querySelector('[data-role="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteClick(comment);
    });

    return item;
}