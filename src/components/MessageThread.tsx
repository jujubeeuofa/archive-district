import { postMessage } from "@/app/actions/messages";
import { formatDate } from "@/lib/format";

type MessageThreadProps = {
  messages: {
    id: string;
    body: string;
    createdAt: Date;
    sender: { name: string; role: string };
  }[];
  currentUserId: string;
  orderId?: string;
  sellSubmissionId?: string;
  redirectPath: string;
};

export default function MessageThread({
  messages,
  currentUserId,
  orderId,
  sellSubmissionId,
  redirectPath,
}: MessageThreadProps) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-bone">Messages</h3>

      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-ink-500">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg border border-ink-700 bg-ink-900 p-3">
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span className="font-medium text-ink-200">
                {m.sender.name} {m.sender.role === "ADMIN" ? "(Staff)" : ""}
              </span>
              <span>{formatDate(m.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-bone">{m.body}</p>
          </div>
        ))}
      </div>

      <form action={postMessage} className="mt-4 flex gap-2">
        <input type="hidden" name="orderId" value={orderId || ""} />
        <input type="hidden" name="sellSubmissionId" value={sellSubmissionId || ""} />
        <input type="hidden" name="redirectPath" value={redirectPath} />
        <input
          className="input"
          name="body"
          placeholder="Write a message..."
          required
        />
        <button type="submit" className="btn-secondary shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
