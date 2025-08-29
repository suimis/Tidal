import { Send } from 'lucide-react';

export default function SendButton({
  submitForm,
  input,
}: {
  submitForm: () => void;
  input: string;
}) {
  return (
    <button
      className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed"
      type="submit"
      disabled={input.length === 0}
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
    >
      <Send size={14} />
    </button>
  );
}
