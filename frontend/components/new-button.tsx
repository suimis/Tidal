import { Plus } from 'lucide-react';

export default function NewButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed"
    >
      <Plus size={14} />
    </button>
  );
}
