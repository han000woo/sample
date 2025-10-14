const prettyColors = [
    '#FF6B6B', // Red
    '#FFD166', // Yellow
    '#06D6A0', // Green
    '#118AB2', // Blue
    '#073B4C', // Dark Blue
    '#EE6C4D', // Orange
    '#9A6324', // Brown
    '#6A4C93', // Purple
    '#F781BE', // Pink
];

let lastColorIndex = -1;

/**
 * ✨ [변경] 미리 정의된 예쁜 색상 팔레트에서 무작위로 색상을 선택하는 함수
 */
function getRandomColor() {
    let randomIndex;

    // 이전에 선택했던 색상과 다른 색상을 고르도록 시도합니다.
    do {
        randomIndex = Math.floor(Math.random() * prettyColors.length);
    } while (prettyColors.length > 1 && randomIndex === lastColorIndex);

    lastColorIndex = randomIndex;
    return prettyColors[randomIndex];
}