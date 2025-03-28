import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { NotificationSettings } from "@/types";

// Hook for managing notification settings
export function useNotificationSettings(defaultValues: NotificationSettings) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [settings, setSettings] = useState<NotificationSettings>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount and when organization changes
  useEffect(() => {
    async function fetchSettings() {
      if (!organization?.id) {
        setSettings(defaultValues);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, "organizations", organization.id, "settings", "notifications"));
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as NotificationSettings);
        } else {
          // If document doesn't exist, initialize with default values
          setSettings(defaultValues);
          // Optional: Create the document with defaults
          await setDoc(doc(db, "organizations", organization.id, "settings", "notifications"), defaultValues);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        setSettings(defaultValues);
        toast({
          title: "Error loading settings",
          description: "There was a problem loading your notification settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [defaultValues, organization, toast]);

  // Update the settings
  const updateSettings = async (newSettings: NotificationSettings) => {
    if (!organization?.id) {
      toast({
        title: "Not authenticated",
        description: "You must be signed in to update settings.",
        variant: "destructive",
      });
      return false;
    }

    // Check if user is an admin
    if (user?.role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only administrators can update notification settings.",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "organizations", organization.id, "settings", "notifications"), 
        newSettings,
        { merge: true }
      );
      
      setSettings(newSettings);
      
      toast({
        title: "Settings updated",
        description: "Your notification settings have been saved successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error saving notification settings:", error);
      
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your notification settings. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update email notification settings specifically
  const updateEmailSettings = async (emailSettings: NotificationSettings["email"]) => {
    const updatedSettings = {
      ...settings,
      email: emailSettings,
    };
    return updateSettings(updatedSettings);
  };

  // Update SMS notification settings specifically
  const updateSmsSettings = async (smsSettings: NotificationSettings["sms"]) => {
    const updatedSettings = {
      ...settings,
      sms: smsSettings,
    };
    return updateSettings(updatedSettings);
  };

  // Update report scheduling settings specifically
  const updateReportSettings = async (reportSettings: NotificationSettings["reports"]) => {
    const updatedSettings = {
      ...settings,
      reports: reportSettings,
    };
    return updateSettings(updatedSettings);
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    updateEmailSettings,
    updateSmsSettings,
    updateReportSettings,
  };
} 