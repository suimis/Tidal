import { Square } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Message } from 'ai';

interface StopButtonProps {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}

export default function StopButton({ stop, setMessages }: StopButtonProps) {
  return (
    <button
      className="bg-neutral-400/50 cursor-pointer size-7 rounded-sm flex justify-center items-center duration-200 hover:opacity-90 hover:ring-1 hover:ring-indigo-500/50 disabled:cursor-not-allowed"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => [...messages.slice(0, messages.length - 1)]);
      }}
    >
      <Square size={14} />
    </button>
  );
}
