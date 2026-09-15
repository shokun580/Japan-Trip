"use client";
import { useState } from "react";
import type { ActionResult } from "@/lib/types";
import { alertError, toastSuccess } from "@/lib/alerts";

export function AlertForm({ action, successText, submitText, disabled, className, children }: {
  action: (formData: FormData) => Promise<ActionResult>;
  successText: string; submitText: string; disabled?: boolean; className?: string; children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  return <form className={className} action={async (formData) => {
    setSaving(true);
    const result = await action(formData);
    setSaving(false);
    if (result.ok) toastSuccess(successText); else alertError(result.message);
  }}>
    {children}
    <button disabled={disabled || saving} className="tap justify-self-start rounded-xl bg-[var(--ink)] px-5 font-medium text-[var(--on-dark)] disabled:opacity-40">{saving ? "กำลังบันทึก…" : submitText}</button>
  </form>;
}
