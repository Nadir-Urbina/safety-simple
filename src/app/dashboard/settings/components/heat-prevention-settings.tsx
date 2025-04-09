"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/organization-context";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Thermometer, Droplets, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Define the threshold levels interface
interface HeatThreshold {
  id: string;
  name: string;
  minHeatIndex: number;
  maxHeatIndex?: number;
  color: string;
  precautions: string[];
}

// Default thresholds that will be used if none are configured
const defaultThresholds: HeatThreshold[] = [
  {
    id: "low",
    name: "Low Risk",
    minHeatIndex: 0,
    maxHeatIndex: 90,
    color: "green",
    precautions: [
      "Provide plenty of drinking water",
      "Ensure adequate shade is available",
      "Allow workers to take preventative cool-down rest when needed"
    ]
  },
  {
    id: "moderate",
    name: "Moderate Risk",
    minHeatIndex: 91,
    maxHeatIndex: 100,
    color: "yellow",
    precautions: [
      "Encourage frequent sips of water (1 cup every 15-20 minutes)",
      "Remind workers to monitor themselves and coworkers for heat illness",
      "Use buddy system to watch for signs of heat-related illness",
      "Take breaks in the shade or a cool area",
      "Adjust work activities (use mechanical equipment, reduce strenuous tasks)"
    ]
  },
  {
    id: "high",
    name: "High Risk",
    minHeatIndex: 101,
    maxHeatIndex: 115,
    color: "orange",
    precautions: [
      "Alert workers of high heat hazard",
      "Establish mandatory cooling breaks (10 minutes every 2 hours)",
      "Increase water consumption to 1 quart per hour",
      "Reschedule non-essential outdoor work",
      "Consider adjusting work hours to cooler times of day",
      "Conduct physiological monitoring (pulse, temperature)",
      "Use cooling techniques (misting, cooling vests)"
    ]
  },
  {
    id: "extreme",
    name: "Extreme Risk",
    minHeatIndex: 116,
    color: "red",
    precautions: [
      "Implement additional mandatory rest breaks",
      "Limit physical exertion",
      "Stop work if essential control methods are inadequate or unavailable",
      "Constant monitoring for symptoms of heat-related illness",
      "Create a cooling area using air conditioners, fans, or misting stations",
      "Consider rescheduling all non-critical outdoor activities"
    ]
  }
];

export function HeatPreventionSettings() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [thresholds, setThresholds] = useState<HeatThreshold[]>([...defaultThresholds]);
  const [weatherApiKey, setWeatherApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!organization?.id) return;

      setIsLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, "organizations", organization.id, "settings", "heatPrevention"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.thresholds && Array.isArray(data.thresholds)) {
            setThresholds(data.thresholds);
          }
          if (data.weatherApiKey) {
            setWeatherApiKey(data.weatherApiKey);
          }
        }
      } catch (error) {
        console.error("Error fetching heat prevention settings:", error);
        toast({
          title: "Error",
          description: "Failed to load heat prevention settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [organization?.id, toast]);

  const handleSave = async () => {
    if (!organization?.id) {
      toast({
        title: "Error",
        description: "Organization information not found",
        variant: "destructive",
      });
      return;
    }

    // Validate thresholds
    for (let i = 0; i < thresholds.length; i++) {
      if (thresholds[i].minHeatIndex === undefined || thresholds[i].minHeatIndex < 0) {
        toast({
          title: "Validation Error",
          description: `Min heat index for ${thresholds[i].name} must be a positive number`,
          variant: "destructive",
        });
        return;
      }

      // If not the last threshold, ensure max heat index is defined
      if (i < thresholds.length - 1 && thresholds[i].maxHeatIndex === undefined) {
        toast({
          title: "Validation Error",
          description: `Max heat index for ${thresholds[i].name} must be defined`,
          variant: "destructive",
        });
        return;
      }

      // Ensure precautions are not empty
      if (thresholds[i].precautions.length === 0) {
        toast({
          title: "Validation Error",
          description: `At least one precaution is required for ${thresholds[i].name}`,
          variant: "destructive",
        });
        return;
      }

      // Ensure thresholds are in order
      if (i > 0 && thresholds[i].minHeatIndex <= thresholds[i-1].minHeatIndex) {
        toast({
          title: "Validation Error",
          description: `Min heat index for ${thresholds[i].name} must be greater than the previous threshold`,
          variant: "destructive",
        });
        return;
      }

      // Ensure min is less than max (if max is defined)
      if (thresholds[i].maxHeatIndex !== undefined && 
          thresholds[i].minHeatIndex >= thresholds[i].maxHeatIndex) {
        toast({
          title: "Validation Error",
          description: `Min heat index must be less than max heat index for ${thresholds[i].name}`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "organizations", organization.id, "settings", "heatPrevention"),
        {
          thresholds,
          weatherApiKey,
          updatedAt: new Date(),
        }
      );

      toast({
        title: "Settings Saved",
        description: "Heat illness prevention settings have been saved",
      });
    } catch (error) {
      console.error("Error saving heat prevention settings:", error);
      toast({
        title: "Error",
        description: "Failed to save heat prevention settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddThreshold = () => {
    const newId = `threshold-${thresholds.length + 1}`;
    // Find the max heat index of the last threshold or start from 0
    const prevMaxHeatIndex = thresholds.length > 0 
      ? (thresholds[thresholds.length - 1].maxHeatIndex || thresholds[thresholds.length - 1].minHeatIndex + 10)
      : 0;

    const newThreshold: HeatThreshold = {
      id: newId,
      name: "New Threshold",
      minHeatIndex: prevMaxHeatIndex + 1,
      maxHeatIndex: prevMaxHeatIndex + 10,
      color: "gray",
      precautions: ["Add precautions here"]
    };

    setThresholds([...thresholds, newThreshold]);
  };

  const handleRemoveThreshold = (index: number) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds.splice(index, 1);
    setThresholds(updatedThresholds);
  };

  const handleAddPrecaution = (thresholdIndex: number) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[thresholdIndex].precautions.push("New precaution");
    setThresholds(updatedThresholds);
  };

  const handleRemovePrecaution = (thresholdIndex: number, precautionIndex: number) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[thresholdIndex].precautions.splice(precautionIndex, 1);
    setThresholds(updatedThresholds);
  };

  const handleUpdateThreshold = (index: number, field: string, value: any) => {
    const updatedThresholds = [...thresholds];
    
    if (field === "minHeatIndex" || field === "maxHeatIndex") {
      // Convert to number
      const numValue = value === "" ? undefined : Number(value);
      (updatedThresholds[index] as any)[field] = numValue;
    } else {
      (updatedThresholds[index] as any)[field] = value;
    }
    
    setThresholds(updatedThresholds);
  };

  const handleUpdatePrecaution = (thresholdIndex: number, precautionIndex: number, value: string) => {
    const updatedThresholds = [...thresholds];
    updatedThresholds[thresholdIndex].precautions[precautionIndex] = value;
    setThresholds(updatedThresholds);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Heat Illness Prevention</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Heat Illness Prevention
        </CardTitle>
        <CardDescription>
          Configure thresholds and required precautions for different heat index levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Configure the heat index thresholds and required precautions based on your company&apos;s policy. 
            These settings will be used to determine required safety measures for field work.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="weatherApiKey">Weather API Key (OpenWeatherMap)</Label>
          <Input 
            id="weatherApiKey" 
            value={weatherApiKey} 
            onChange={(e) => setWeatherApiKey(e.target.value)}
            placeholder="Enter your OpenWeatherMap API key"
          />
          <p className="text-xs text-muted-foreground">
            Get your API key at <a href="https://openweathermap.org/api" className="underline" target="_blank" rel="noopener noreferrer">openweathermap.org</a>
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Heat Index Thresholds</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddThreshold}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Threshold
            </Button>
          </div>

          {thresholds.map((threshold, thresholdIndex) => (
            <Card key={threshold.id} className="border-2" style={{ borderColor: threshold.color }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Input
                      value={threshold.name}
                      onChange={(e) => handleUpdateThreshold(thresholdIndex, "name", e.target.value)}
                      className="font-semibold"
                    />
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center gap-1">
                        <Label>Min:</Label>
                        <Input
                          type="number"
                          value={threshold.minHeatIndex}
                          onChange={(e) => handleUpdateThreshold(thresholdIndex, "minHeatIndex", e.target.value)}
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Label>Max:</Label>
                        <Input
                          type="number"
                          value={threshold.maxHeatIndex || ""}
                          onChange={(e) => handleUpdateThreshold(thresholdIndex, "maxHeatIndex", e.target.value)}
                          className="w-20"
                          placeholder="∞"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Label>Color:</Label>
                        <Input
                          type="text"
                          value={threshold.color}
                          onChange={(e) => handleUpdateThreshold(thresholdIndex, "color", e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveThreshold(thresholdIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Required Precautions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPrecaution(thresholdIndex)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  {threshold.precautions.map((precaution, precautionIndex) => (
                    <div key={precautionIndex} className="flex items-start gap-2">
                      <Textarea
                        value={precaution}
                        onChange={(e) => handleUpdatePrecaution(thresholdIndex, precautionIndex, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePrecaution(thresholdIndex, precautionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
} 