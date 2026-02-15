
const PATTERN_YYYY_MM = /^(\d{4})-(\d{2})$/;
const PATTERN_YY_KR = /^(\d{2})년\s*(\d{1,2})월$/;
const PATTERN_YYYY_KR = /^(\d{4})년\s*(\d{1,2})월$/;

function normalizeSheetName(name) {
    const trimmed = name.trim();
    if (trimmed.includes("복사용")) {
        return null;
    }

    // 1. Check YYYY-MM
    if (PATTERN_YYYY_MM.test(trimmed)) {
        return trimmed;
    }

    // 2. Check YY년 M월
    const matchYY = trimmed.match(PATTERN_YY_KR);
    if (matchYY) {
        const year = `20${matchYY[1]}`;
        const month = matchYY[2].padStart(2, "0");
        return `${year}-${month}`;
    }

    // 3. Check YYYY년 M월
    const matchYYYY = trimmed.match(PATTERN_YYYY_KR);
    if (matchYYYY) {
        const year = matchYYYY[1];
        const month = matchYYYY[2].padStart(2, "0");
        return `${year}-${month}`;
    }

    return null;
}

const testCases = [
    "2024-01",
    "24년 1월",
    "24년 11월",
    "2024년 2월",
    "25년 3월",
    "3월", // Should be null
    "복사용", // Should be null
    "Sheet1", // Should be null
];

console.log("Testing normalizeSheetName logic:");
testCases.forEach(name => {
    console.log(`"${name}" -> ${normalizeSheetName(name)}`);
});
