"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { 
  SettingsCategory, 
  GeneralSettings, 
  WorkingHoursSettings, 
  BrandingSettings, 
  NotificationSettings, 
  ComplianceSettings, 
  DataManagementSettings,
  fetchSettings,
  saveSettings
} from "../lib/settings";
import { WithFieldValue, DocumentData } from "firebase/firestore";

interface UseOrganizationSettingsProps<T extends WithFieldValue<DocumentData>> {
  category: SettingsCategory;
  defaultValues: T;
}

export function useOrganizationSettings<T extends WithFieldValue<DocumentData>>({
  category,
  defaultValues
}: UseOrganizationSettingsProps<T>) {
  const { toast } = useToast();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [settings, setSettings] = useState<T>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      try {
        const data = await fetchSettings<T>(organization.id, category);
        if (data) {
          setSettings(data);
        } else {
          // If no settings exist yet, use defaults
          setSettings(defaultValues);
        }
      } catch (error) {
        console.error(`Error loading ${category} settings:`, error);
        toast({
          title: "Error loading settings",
          description: "There was a problem loading your settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [organization?.id, category]);

  const updateSettings = async (newSettings: T) => {
    if (!organization?.id) {
      toast({
        title: "Not authenticated",
        description: "You must be signed in to update settings.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is an admin
    if (user?.role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only administrators can update organization settings.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveSettings(organization.id, category, newSettings);
      setSettings(newSettings);
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error(`Error saving ${category} settings:`, error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateSettings
  };
}

// Helper hooks for specific settings types
export const useGeneralSettings = (defaultValues: GeneralSettings) => 
  useOrganizationSettings<GeneralSettings>({
    category: 'general',
    defaultValues
  });

export const useWorkingHoursSettings = (defaultValues: WorkingHoursSettings) => 
  useOrganizationSettings<WorkingHoursSettings>({
    category: 'workingHours',
    defaultValues
  });

export const useBrandingSettings = (defaultValues: BrandingSettings) => 
  useOrganizationSettings<BrandingSettings>({
    category: 'branding',
    defaultValues
  });

export const useNotificationSettings = (defaultValues: NotificationSettings) => 
  useOrganizationSettings<NotificationSettings>({
    category: 'notifications',
    defaultValues
  });

export const useComplianceSettings = (defaultValues: ComplianceSettings) => 
  useOrganizationSettings<ComplianceSettings>({
    category: 'compliance',
    defaultValues
  });

export const useDataManagementSettings = (defaultValues: DataManagementSettings) => 
  useOrganizationSettings<DataManagementSettings>({
    category: 'dataManagement',
    defaultValues
  }); 