"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FormBuilder } from "@/components/forms/form-builder"
import { FormTemplate, FormCategory } from "@/src/types/forms"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { doc, getDoc, setDoc, collection, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormRenderer } from "@/components/forms/form-renderer"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, ArrowLeft, Save, DownloadIcon, DatabaseIcon } from "lucide-react"
import { toast } from "sonner"
import { getAuth } from "firebase/auth"
import { processFirestoreData, getUserId } from "@/lib/firebase-utils"

export default function FormBuilderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { organization } = useOrganization()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("You must be logged in to access this page")
      router.push("/login")
    }
  }, [user, authLoading, router])
  
  // Get formId from query params
  const formId = searchParams.get("id")
  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    id: formId || uuidv4(),
    organizationId: organization?.id || "",
    name: "",
    description: "",
    category: "other" as FormCategory,
    fields: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: getUserId(user) || "",
    isActive: true,
    version: 1,
    isLatestVersion: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState("")
  const [draftPromptDisabled, setDraftPromptDisabled] = useState<boolean>(
    typeof window !== 'undefined' && localStorage.getItem('disableDraftPrompts') === 'true'
  )
  
  // Load form if editing existing
  useEffect(() => {
    const loadForm = async () => {
      if (!formId || !organization?.id) return
      
      try {
        setIsLoading(true)
        const formRef = doc(db, "organizations", organization.id, "formTemplates", formId)
        const formDoc = await getDoc(formRef)
        
        if (formDoc.exists()) {
          const formData = formDoc.data();
          
          // Convert Firestore timestamps to Date objects
          const formWithDates = processFirestoreData(formData as any);
          
          setFormTemplate(formWithDates as FormTemplate)
        } else {
          toast.error("Form not found")
          router.push("/dashboard/forms")
        }
      } catch (error) {
        console.error("Error loading form:", error)
        toast.error("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (formId) {
      loadForm()
    }
  }, [formId, organization?.id, router])
  
  // Handler for form changes
  const handleFormChange = (updatedTemplate: FormTemplate) => {
    setFormTemplate(updatedTemplate)
  }
  
  // At the beginning of the file, after state declarations
  // Disable draft functionality entirely by default
  useEffect(() => {
    // Completely disable draft functionality by default
    localStorage.setItem('disableDraftPrompts', 'true');
    setDraftPromptDisabled(true);
    
    // Clear ALL form drafts immediately
    try {
      let draftCount = 0;
      // Find all keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Remove any form draft keys
        if (key && key.startsWith('form_draft_')) {
          localStorage.removeItem(key);
          draftCount++;
        }
      }
      if (draftCount > 0) {
        console.log(`Purged ${draftCount} form drafts on startup`);
      }
    } catch (error) {
      console.error("Error clearing drafts:", error);
    }
  }, []);
  
  // Replace the restore draft effect with a completely disabled version
  useEffect(() => {
    // This effect intentionally does nothing now that drafts are disabled by default
    // We keep the effect for future enhancement possibilities
  }, [formId, isLoading, draftPromptDisabled]);

  // Also disable the auto-save effect to stop creating new drafts
  useEffect(() => {
    // This auto-save functionality is disabled since we've chosen to disable drafts
    // by default to avoid confusing popups
  }, [formTemplate, formId]);
  
  // Save form to Firestore
  const saveForm = async () => {
    console.log("Auth state when saving:", { user, organizationId: organization?.id });
    
    if (!organization?.id) {
      toast.error("Organization information missing")
      return
    }
    
    const userId = getUserId(user);
    if (!userId) {
      toast.error("User authentication required");
      
      // Check if we have a localStorage backup before redirecting
      try {
        // Ensure we use a valid date
        const now = new Date();
        const safeDate = isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();
        
        localStorage.setItem(
          `form_draft_${formId || 'new'}`,
          JSON.stringify({
            ...formTemplate,
            lastSaved: safeDate
          })
        );
        toast.info("Your form has been backed up locally. Please log in again to save it.");
      } catch (error) {
        console.error("Error creating backup:", error);
      }
      
      // If we're here, the user might be logged out, redirect to login
      router.push("/login?redirect=" + encodeURIComponent(`/dashboard/forms/builder?id=${formId || ''}`));
      return
    }
    
    // Always create a backup before attempting to save
    try {
      // Ensure we use a valid date
      const now = new Date();
      const safeDate = isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();
      
      localStorage.setItem(
        `form_draft_${formId || 'new'}`,
        JSON.stringify({
          ...formTemplate,
          lastSaved: safeDate
        })
      );
      console.log("Created safety backup before saving to Firestore");
    } catch (error) {
      console.error("Error creating backup:", error);
    }
    
    try {
      setIsSaving(true);
      
      // Make sure createdBy is set
      const updatedTemplate = {
        ...formTemplate,
        createdBy: formTemplate.createdBy || userId,
        organizationId: organization.id,
        // Convert Date objects to Firestore compatible timestamps
        createdAt: formTemplate.createdAt,
        updatedAt: new Date()
      }
      
      // Try to refresh the Firebase auth token first
      try {
        // This forces a token refresh
        const auth = getAuth();
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
          console.log("Auth token refreshed before saving");
        }
      } catch (refreshError) {
        console.warn("Could not refresh auth token:", refreshError);
      }
      
      // Prepare form data for Firestore
      const firestoreData = {
        ...updatedTemplate,
        fields: updatedTemplate.fields.map((field: any) => {
          // Create a cleaned copy of the field without undefined values
          const cleanedField = { ...field };
          
          // Handle options separately if they exist
          if (field.options) {
            cleanedField.options = field.options.map((option: any) => {
              // Clean each option to remove undefined values
              const cleanedOption = { ...option };
              // Replace any undefined values with null
              Object.keys(cleanedOption).forEach(key => {
                if (cleanedOption[key] === undefined) {
                  cleanedOption[key] = null;
                }
              });
              return cleanedOption;
            });
          } else {
            cleanedField.options = null; // Use null instead of undefined
          }
          
          // Replace any undefined values with null
          Object.keys(cleanedField).forEach(key => {
            if (cleanedField[key] === undefined) {
              cleanedField[key] = null;
            }
          });
          
          return cleanedField;
        })
      };
      
      // Clean the entire document to replace any undefined values with null
      const firestoreDataObj = firestoreData as Record<string, any>;
      Object.keys(firestoreDataObj).forEach(key => {
        if (firestoreDataObj[key] === undefined) {
          firestoreDataObj[key] = null;
        }
      });
      
      // Set the form in Firestore
      const formRef = doc(
        db, 
        "organizations", 
        organization.id, 
        "formTemplates", 
        updatedTemplate.id
      )
      
      // Use transaction to ensure integrity and better error handling
      await runTransaction(db, async (transaction) => {
        // Check if we can read the document first (validates permissions)
        const formDoc = await transaction.get(formRef);
        
        // Add the document or update it
        transaction.set(formRef, firestoreData);
        return { success: true };
      });
      
      console.log("Form saved successfully to Firestore!");
      
      // Clear localStorage draft on successful save
      localStorage.removeItem(`form_draft_${formId || 'new'}`);
      
      // Show success notification
      toast.success(formId ? "Form updated successfully" : "Form created successfully", {
        duration: 4000,
        position: "top-center"
      });
      
      // If it's a new form, update the URL to include the form ID
      if (!formId) {
        router.push(`/dashboard/forms/builder?id=${updatedTemplate.id}`);
      }
    } catch (error: any) {
      console.error("Error saving form:", error);
      
      // Don't redirect for permission errors, just show an error
      if (error.code && (
          error.code === 'auth/unauthorized' || 
          error.code === 'permission-denied' ||
          error.code === 'unauthenticated'
        )) {
        
        toast.error("Permission error: " + (error.message || "Authentication problem"), {
          duration: 8000
        });
        
        toast.info("Your form is still backed up locally. Try refreshing the page.", {
          duration: 10000
        });
      } else {
        toast.error("Failed to save form: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsSaving(false);
    }
  }
  
  // Handle tab changes with unsaved changes check
  const handleTabChange = (value: string) => {
    // Check if there are unsaved changes
    if (activeTab === "edit") {
      setActiveTab(value)
    } else {
      setActiveTab(value)
    }
  }
  
  // Handle back button
  const handleBack = () => {
    // Simple check if there might be unsaved changes (in a real app, do a deeper comparison)
    setRedirectPath("/dashboard/forms")
    setShowUnsavedChanges(true)
  }
  
  // Redirect after confirmation
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath)
    }
  }, [shouldRedirect, redirectPath, router])
  
  // Add a function to manually force save without redirection
  const forceSaveForm = async () => {
    try {
      // Skip auth checks - we'll handle errors if they occur
      setIsSaving(true);
      
      // Create a direct reference to Firestore
      const formRef = doc(
        db, 
        "organizations", 
        organization?.id || 'unknown', 
        "formTemplates", 
        formTemplate.id
      );
      
      // Prepare form data
      const firestoreData = {
        ...formTemplate,
        fields: formTemplate.fields.map((field: any) => {
          // Create a cleaned copy of the field without undefined values
          const cleanedField = { ...field };
          
          // Handle options separately if they exist
          if (field.options) {
            cleanedField.options = field.options.map((option: any) => {
              // Clean each option to remove undefined values
              const cleanedOption = { ...option };
              // Replace any undefined values with null
              Object.keys(cleanedOption).forEach(key => {
                if (cleanedOption[key] === undefined) {
                  cleanedOption[key] = null;
                }
              });
              return cleanedOption;
            });
          } else {
            cleanedField.options = null; // Use null instead of undefined
          }
          
          // Replace any undefined values with null
          Object.keys(cleanedField).forEach(key => {
            if (cleanedField[key] === undefined) {
              cleanedField[key] = null;
            }
          });
          
          return cleanedField;
        })
      };
      
      // Clean the entire document to replace any undefined values with null
      const firestoreDataObj = firestoreData as Record<string, any>;
      Object.keys(firestoreDataObj).forEach(key => {
        if (firestoreDataObj[key] === undefined) {
          firestoreDataObj[key] = null;
        }
      });
      
      // Directly attempt to write without transactions
      await setDoc(formRef, firestoreData);
      
      // Show success alert - avoid toast which might redirect
      alert("Form saved successfully to Firestore!");
      
      return true;
    } catch (error) {
      console.error("Force save error:", error);
      alert("Error saving: " + (error as any).message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update beforeunload handler to respect draft settings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only save to localStorage if drafts are enabled
      if (!draftPromptDisabled && formTemplate?.id) {
        try {
          // Ensure we use a valid date
          const now = new Date();
          const safeDate = isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();
          
          localStorage.setItem(
            `form_draft_${formId || 'new'}`, 
            JSON.stringify({
              ...formTemplate,
              lastSaved: safeDate
            })
          );
        } catch (error) {
          console.error("Error saving to localStorage on unload:", error);
        }
      }
      
      // Always show confirmation dialog if there are changes
      if (formTemplate.fields.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formTemplate, formId, draftPromptDisabled]);
  
  // Add downloadFormAsJson function
  const downloadFormAsJson = () => {
    try {
      // Create a JSON string from the form data
      const jsonData = JSON.stringify(formTemplate, null, 2);
      
      // Create a blob from the JSON string
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `form_${formTemplate.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      
      // Append the link to the body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the URL object
      URL.revokeObjectURL(url);
      
      toast.success("Form downloaded as JSON");
    } catch (error) {
      console.error("Error downloading form:", error);
      toast.error("Failed to download form");
    }
  };
  
  // Comprehensive function to clear all drafts and fix any issues
  const clearAllDrafts = () => {
    try {
      // Find all keys in localStorage - not just form drafts
      const allKeys: (string | null)[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        allKeys.push(localStorage.key(i));
      }
      
      // Process all keys
      const draftKeys: string[] = [];
      
      // First identify all the keys we want to remove
      allKeys.forEach(key => {
        if (!key) return;
        
        // Handle form draft keys
        if (key.startsWith('form_draft_')) {
          draftKeys.push(key);
          return;
        }
        
        // Check for any date-related keys that might be causing issues
        try {
          const value = localStorage.getItem(key);
          if (value && value.includes('2025-04-04')) {
            // This could be related to the future date issue
            draftKeys.push(key);
          }
        } catch (e) {
          // If we can't parse a key, it might be corrupted - consider removing it
          console.warn(`Found potentially corrupted localStorage key: ${key}`);
        }
      });
      
      // Now remove all identified keys
      if (draftKeys.length > 0) {
        draftKeys.forEach(key => localStorage.removeItem(key));
        console.log(`Removed ${draftKeys.length} localStorage items`);
        toast.success(`Cleared ${draftKeys.length} items from browser storage`);
      } else {
        toast.info("No drafts or problematic data found");
      }
    } catch (error) {
      console.error("Error clearing storage:", error);
      toast.error("Failed to clear local storage");
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {formId ? "Edit Form" : "Create New Form"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {formTemplate.updatedAt && formId && (
            <p className="text-sm text-muted-foreground mr-2">
              Last saved: {new Date(formTemplate.updatedAt).toLocaleTimeString()}
            </p>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => {
              // Clear all existing drafts first
              clearAllDrafts();
              
              // Toggle draft prompts state
              const newState = !draftPromptDisabled;
              setDraftPromptDisabled(newState);
              localStorage.setItem('disableDraftPrompts', newState ? 'true' : 'false');
              
              if (newState) {
                toast.success("Draft functionality disabled");
              } else {
                toast.success("Draft functionality enabled - your changes will be auto-saved");
              }
            }}
            title={draftPromptDisabled ? "Enable form draft auto-saving" : "Disable form draft auto-saving"}
            className="text-xs"
            size="sm"
          >
            {draftPromptDisabled ? "Enable Drafts" : "Disable Drafts"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={downloadFormAsJson}
            disabled={isSaving}
            title="Download form as JSON backup"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Backup
          </Button>
          
          <Button 
            variant="secondary"
            onClick={forceSaveForm}
            disabled={isSaving}
            title="Force save (use if having issues)"
          >
            <DatabaseIcon className="h-4 w-4 mr-2" />
            Force Save
          </Button>
          
          <Button onClick={saveForm} disabled={isSaving} className="relative overflow-hidden">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Form"}
            {isSaving && (
              <span className="absolute bottom-0 left-0 h-1 bg-primary-foreground animate-progress"></span>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          <FormBuilder 
            formTemplate={formTemplate} 
            onChange={handleFormChange}
            onSave={saveForm}
            isSaving={isSaving}
          />
        </TabsContent>
        
        <TabsContent value="preview">
          {formTemplate.fields && formTemplate.fields.length > 0 ? (
            <div className="max-w-3xl mx-auto">
              <FormRenderer
                formTemplate={formTemplate}
                onSubmit={(data) => {
                  console.log("Form submitted with data:", data)
                  toast.success("Form submitted (preview mode)")
                }}
                onSaveDraft={(data) => {
                  console.log("Draft saved with data:", data)
                  toast.info("Draft saved (preview mode)")
                }}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Fields Added</CardTitle>
                <CardDescription>
                  You need to add at least one field to preview the form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveTab("edit")}>
                  Go to Editor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Unsaved Changes Alert */}
      <AlertDialog open={showUnsavedChanges} onOpenChange={setShowUnsavedChanges}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you navigate away. 
              Would you like to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedChanges(false)
              setShouldRedirect(false)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await saveForm()
              setShowUnsavedChanges(false)
              setShouldRedirect(true)
            }}>
              Save & Leave
            </AlertDialogAction>
            <AlertDialogAction onClick={() => {
              setShowUnsavedChanges(false)
              setShouldRedirect(true)
            }}>
              Leave without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 