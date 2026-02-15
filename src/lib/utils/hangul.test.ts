import { describe, expect, it } from "vitest";
import { appendYi, hasBatchim } from "./hangul";

describe("utils/hangul", () => {
    it("detects batchim correctly", () => {
        expect(hasBatchim("겨울")).toBe(true); // 울
        expect(hasBatchim("민규")).toBe(false); // 규
        expect(hasBatchim("두부")).toBe(false); // 부
        expect(hasBatchim("정국")).toBe(true); // 국
        expect(hasBatchim("구름")).toBe(true); // 름
        expect(hasBatchim("ABC")).toBe(false); // 영어
        expect(hasBatchim("")).toBe(false); // 빈 문자열
    });

    it("appends '이' only when batchim exists", () => {
        expect(appendYi("겨울")).toBe("겨울이");
        expect(appendYi("민규")).toBe("민규");
        expect(appendYi("두부")).toBe("두부");
        expect(appendYi("정국")).toBe("정국이");
        expect(appendYi("구름")).toBe("구름이");
    });
});
