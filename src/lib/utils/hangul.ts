/**
 * 한글 유틸리티 함수
 */

// 한글 유니코드 범위
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/**
 * 문자에 받침이 있는지 확인합니다.
 * @param char 확인할 문자
 * @returns 받침이 있으면 true, 없거나 한글이 아니면 false
 */
export function hasBatchim(char: string): boolean {
    if (!char) return false;

    const code = char.charCodeAt(char.length - 1);

    // 한글이 아닌 경우 false 반환
    if (code < HANGUL_START || code > HANGUL_END) {
        return false;
    }

    // (초성 * 21 + 중성) * 28 + 종성
    // 종성이 0이면 받침 없음, > 0이면 받침 있음
    const jongseong = (code - HANGUL_START) % 28;
    return jongseong > 0;
}

/**
 * 이름 뒤에 조사 '이'를 붙입니다. (받침이 있을 때만)
 * 예: "겨울" -> "겨울이", "두부" -> "두부"
 * @param name 원본 이름
 * @returns 조사 '이'가 붙은(또는 안 붙은) 이름
 */
export function appendYi(name: string): string {
    if (!name) return "";

    if (hasBatchim(name)) {
        return `${name}이`;
    }
    return name;
}
