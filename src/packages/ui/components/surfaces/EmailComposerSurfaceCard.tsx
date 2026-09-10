"use client";

import React, { useState } from "react";
import {
  Mail,
  Send,
  User,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Edit3,
  XCircle,
} from "lucide-react";

interface EmailDraftProfile {
  recipientName: string;
  recipientEmail: string;
  restaurantName: string;
  subject: string;
  bodyPreview: string;
  consequence: string;
}

interface EmailComposerSurfaceCardProps {
  draft?: EmailDraftProfile;
  onSend?: (recipientEmail: string, subject: string, body: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const DEFAULT_DRAFT: EmailDraftProfile = {
  recipientName: "Elena Rostova",
  recipientEmail: "elena@cantinabella.it",
  restaurantName: "Cantina Bella",
  subject: "[Executive Action Plan] Revitalization & Chef's Pairing Strategy for Cantina Bella",
  bodyPreview: `Dear Elena,

Prosis analytics detected a 34% drop in weekly covers at Cantina Bella, coinciding with road repairs on Via Veneto. 

To recover weekday dinner volume, we have staged a complimentary chef's table pairing incentive for your top 25 high-spending repeat guests for Tuesday–Thursday dining.

Please review the attached VIP guest roster and let us know if you would like to adjust table allocations.

Best regards,
Operations Director | Prosis Operating OS`,
  consequence: "Outbound email will be dispatched to the venue general manager with VIP booking incentives.",
};

export const EmailComposerSurfaceCard: React.FC<EmailComposerSurfaceCardProps> = ({
  draft = DEFAULT_DRAFT,
  onSend,
  onCancel,
  disabled = false,
}) => {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.bodyPreview);
  const [isEditing, setIsEditing] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    setIsSent(true);
    onSend?.(draft.recipientEmail, subject, body);
  };

  return (
    <div className="my-5 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-command-card relative overflow-hidden text-charcoal-900 animate-fade-in">
      {/* Top Ambient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-700">
                ACTION COMPOSER SURFACE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-bone-100 text-charcoal-600">
                Outbound Communication Gate
              </span>
            </div>
            <h3 className="text-sm font-semibold text-charcoal-900 mt-0.5">
              Draft Executive Communication to {draft.recipientName}
            </h3>
          </div>
        </div>

        <span className="text-xs font-mono text-charcoal-400 self-start sm:self-auto">
          To: <span className="text-charcoal-800 font-medium">{draft.recipientEmail}</span>
        </span>
      </div>

      {/* Email Body Workspace */}
      <div className="p-4 rounded-2xl bg-bone-50/70 border border-black/[0.04] space-y-3 mb-4 text-xs">
        <div>
          <label className="text-[10px] font-mono uppercase text-charcoal-400 block mb-1">
            Subject
          </label>
          {isEditing ? (
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-black/10 bg-white font-medium text-xs text-charcoal-900"
            />
          ) : (
            <div className="font-semibold text-charcoal-900 bg-white p-2 rounded-xl border border-black/[0.04]">
              {subject}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-mono uppercase text-charcoal-400">
              Message Body Preview
            </label>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] font-mono text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? "Done Editing" : "Edit Copy"}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white font-sans text-xs text-charcoal-900 leading-relaxed"
            />
          ) : (
            <div className="p-3 rounded-xl bg-white border border-black/[0.04] text-charcoal-700 whitespace-pre-line leading-relaxed font-sans">
              {body}
            </div>
          )}
        </div>

        {/* Consequence Analysis */}
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-300/40 text-[11.5px] text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Consequence Review: </strong>
            {draft.consequence}
          </span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={disabled || isSent}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-charcoal-600 hover:text-charcoal-900 bg-white hover:bg-bone-100 border border-black/10 transition-all active:scale-95"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={disabled || isSent}
          className="ml-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {isSent ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dispatched</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Authorize & Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

