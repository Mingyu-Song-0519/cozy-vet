export function Header() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">코지동물의료센터</p>
        <p className="text-sm font-medium text-slate-800">{today}</p>
      </div>
    </header>
  );
}
