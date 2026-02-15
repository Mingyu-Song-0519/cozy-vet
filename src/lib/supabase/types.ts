import type { MessageLog, MessageTemplate } from "@/types/message";
import type { Patient, HealthCheckup } from "@/types/patient";
import type { Reminder } from "@/types/reminder";

type HospitalSetting = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: Omit<Patient, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Patient>;
        Relationships: [];
      };
      health_checkups: {
        Row: HealthCheckup;
        Insert: Omit<HealthCheckup, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<HealthCheckup>;
        Relationships: [];
      };
      message_templates: {
        Row: MessageTemplate;
        Insert: Omit<MessageTemplate, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MessageTemplate>;
        Relationships: [];
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Reminder>;
        Relationships: [];
      };
      message_logs: {
        Row: MessageLog;
        Insert: Omit<MessageLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
          copied_at?: string;
        };
        Update: Partial<MessageLog>;
        Relationships: [];
      };
      hospital_settings: {
        Row: HospitalSetting;
        Insert: Omit<HospitalSetting, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<HospitalSetting>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
