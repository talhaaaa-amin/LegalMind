import { MessageSquarePlus } from 'lucide-react';
import type { QuestionResponse } from '../types/contracts';

interface ConversationListProps {
  responses: QuestionResponse[];
  selectedId?: string;
  onSelect: (response: QuestionResponse) => void;
  onFollowUp: () => void;
}

export function ConversationList({ responses, selectedId, onSelect, onFollowUp }: ConversationListProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">Conversation history</h2>
        <button onClick={onFollowUp} className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline">
          <MessageSquarePlus size={14} /> Follow up
        </button>
      </div>
      <div className="mt-4 space-y-1">
        {responses.length === 0 && <p className="py-4 text-xs leading-5 text-slate-400">Questions asked in this case will appear here.</p>}
        {responses.map((response) => (
          <button
            key={response.id}
            onClick={() => onSelect(response)}
            className={`w-full rounded-lg px-3 py-2.5 text-left text-xs leading-5 transition ${selectedId === response.id ? 'bg-teal/10 font-semibold text-teal' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span className="line-clamp-2">{response.question}</span>
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{new Date(response.createdAt).toLocaleString()}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
