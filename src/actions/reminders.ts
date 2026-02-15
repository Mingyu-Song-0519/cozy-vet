"use server";

import { buildRemindersForPatient } from "@/lib/reminders/scheduler";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { todayISO } from "@/lib/utils/date";
import type { ReminderWithPatient } from "@/types/reminder";

export async function getTodayReminders(): Promise<ReminderWithPatient[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("reminders")
    .select("*, patient:patients(*)")
    .lte("due_date", todayISO())
    .eq("status", "pending")
    .order("due_date", { ascending: true });

  return ((data ?? []) as ReminderWithPatient[]).filter((item) => item.patient);
}

export async function completeReminder(reminderId: string) {
  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      reminderId,
      status: "completed" as const,
      completedAt: new Date().toISOString(),
      persisted: false,
    };
  }

  const completedAt = new Date().toISOString();
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "completed", completed_at: completedAt })
    .eq("id", reminderId);
  if (error) {
    return {
      ok: false,
      reminderId,
      message: error.message,
    };
  }

  return {
    ok: true,
    reminderId,
    status: "completed" as const,
    completedAt,
    persisted: true,
  };
}

export async function skipReminder(reminderId: string) {
  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      reminderId,
      status: "skipped" as const,
      updatedAt: new Date().toISOString(),
      persisted: false,
    };
  }

  const updatedAt = new Date().toISOString();
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "skipped" })
    .eq("id", reminderId);
  if (error) {
    return {
      ok: false,
      reminderId,
      message: error.message,
    };
  }

  return {
    ok: true,
    reminderId,
    status: "skipped" as const,
    updatedAt,
    persisted: true,
  };
}

export async function regenerateReminders(patientId: string) {
  if (!hasSupabaseEnv()) {
    return {
      patientId,
      regenerated: false,
      generatedCount: 0,
      persisted: false,
    };
  }

  const supabase = getSupabaseServerClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();
  const patientRow = patient as Database["public"]["Tables"]["patients"]["Row"] | null;
  if (!patientRow) {
    return {
      patientId,
      regenerated: false,
      generatedCount: 0,
      persisted: true,
    };
  }

  await supabase
    .from("reminders")
    .delete()
    .eq("patient_id", patientId)
    .eq("status", "pending");

  const reminderRows = buildRemindersForPatient(patientRow);
  if (reminderRows.length > 0) {
    await supabase.from("reminders").insert(reminderRows);
  }

  return {
    patientId,
    regenerated: true,
    generatedCount: reminderRows.length,
    persisted: true,
  };
}
