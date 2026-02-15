type MessagePreviewProps = {
  content: string;
};

export function MessagePreview({ content }: MessagePreviewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold">미리보기</h3>
      <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        {content}
      </pre>
    </section>
  );
}
