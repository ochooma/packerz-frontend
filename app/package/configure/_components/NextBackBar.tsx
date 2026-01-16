type Props = {
  step: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function NextBackBar({ step, canGoNext, onPrev, onNext }: Props) {
  const nextLabel = step < 5 ? '다음 단계' : '파일 업로드로 진행하기';

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 disabled:opacity-40"
      >
        이전
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}