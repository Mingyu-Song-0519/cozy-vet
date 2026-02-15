import { describe, expect, it } from "vitest";
import {
  buildFooter,
  chooseFollowupTemplateType,
  renderTemplate,
} from "@/lib/messages/generator";

describe("messages/generator", () => {
  it("renders variables in template", () => {
    const text = renderTemplate("{{pet_name}} 복약 {{med_days}}일", {
      pet_name: "겨울이",
      med_days: 7,
    });

    expect(text).toBe("겨울이 복약 7일");
  });

  it("appends '이' to pet_name if it has batchim", () => {
    // 받침 있는 이름: 겨울 -> 겨울이
    const text1 = renderTemplate("안녕 {{pet_name}}", { pet_name: "겨울" });
    expect(text1).toBe("안녕 겨울이");

    // 받침 없는 이름: 두부 -> 두부
    const text2 = renderTemplate("안녕 {{pet_name}}", { pet_name: "두부" });
    expect(text2).toBe("안녕 두부");
  });

  it("chooses followup template by threshold and month", () => {
    expect(chooseFollowupTemplateType(450000, 3)).toBe("followup_high_3m");
    expect(chooseFollowupTemplateType(450000, 6)).toBe("followup_high_6m");
    expect(chooseFollowupTemplateType(180000, 3)).toBe("followup_low_3m");
    expect(chooseFollowupTemplateType(180000, 6)).toBe("followup_low_6m");
  });

  it("builds common footer", () => {
    const footer = buildFooter();
    expect(footer).toContain("032-423-7588");
    expect(footer).toContain("카카오톡채널 바로가기");
  });

  it("builds footer with overridden settings", () => {
    const footer = buildFooter({
      phone_main: "02-111-2222",
      kakao_channel_url: "http://example.com/chat",
    });
    expect(footer).toContain("02-111-2222");
    expect(footer).toContain("http://example.com/chat");
  });
});
