import { describe, test, expect } from "vitest";

// Pure helper extracted from the hook for testability
const TODAY = "2026-02-22";

function groupQuests(quests: Array<{ dueDate: string }>, today: string) {
  return {
    overdue: quests.filter((q) => q.dueDate < today),
    todayQuests: quests.filter((q) => q.dueDate === today),
    upcoming: quests.filter((q) => q.dueDate > today),
  };
}

describe("quest grouping", () => {
  const quests = [
    { dueDate: "2026-02-20" }, // overdue
    { dueDate: "2026-02-22" }, // today
    { dueDate: "2026-02-22" }, // today
    { dueDate: "2026-02-25" }, // upcoming
  ];

  test("groups overdue correctly", () => {
    const { overdue } = groupQuests(quests, TODAY);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].dueDate).toBe("2026-02-20");
  });

  test("groups today correctly", () => {
    const { todayQuests } = groupQuests(quests, TODAY);
    expect(todayQuests).toHaveLength(2);
  });

  test("groups upcoming correctly", () => {
    const { upcoming } = groupQuests(quests, TODAY);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].dueDate).toBe("2026-02-25");
  });
});
