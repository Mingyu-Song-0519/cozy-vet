export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return "-";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

export function toBooleanFromOX(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  return value.trim().toUpperCase() === "O";
}
