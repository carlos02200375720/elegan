import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
interface Props { error: string | null; success: string | null; }
export default function AlertasPublicasion({ error, success }: Props) {
  return (
    <>
              {/* Alerts */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{success}</span>
                </div>
              )}
    </>
  );
}
