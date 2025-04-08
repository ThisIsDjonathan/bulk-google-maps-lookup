"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Info, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BatchConfig } from "@/types/lookup-types";

interface BatchConfigProps {
  config: BatchConfig;
  onConfigChange: (config: BatchConfig) => void;
}

export function BatchConfigSimple({
  config,
  onConfigChange,
}: BatchConfigProps) {
  const [localConfig, setLocalConfig] = useState<BatchConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  // Log when component mounts
  useEffect(() => {
    console.log("BatchConfigSimple mounted with config:", config);
  }, [config]);

  const handleBatchSizeChange = (value: number[]) => {
    console.log("Batch size changed:", value[0]);
    setLocalConfig({ ...localConfig, batchSize: value[0] });
  };

  const handleBatchSizeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      console.log("Batch size input changed:", value);
      setLocalConfig({ ...localConfig, batchSize: value });
    }
  };

  const handleDelayChange = (value: number[]) => {
    console.log("Delay changed:", value[0]);
    setLocalConfig({ ...localConfig, delayBetweenBatches: value[0] });
  };

  const handleDelayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 10000) {
      console.log("Delay input changed:", value);
      setLocalConfig({ ...localConfig, delayBetweenBatches: value });
    }
  };

  const handleApply = () => {
    console.log("Apply settings clicked. New config:", localConfig);
    onConfigChange(localConfig);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    console.log("Batch Settings button clicked");
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleButtonClick}
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Batch Settings</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Batch Processing Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure how locations are processed in batches to optimize
                performance and avoid API rate limits.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Number of locations to process in each batch. Smaller
                          batches are more reliable but slower. Larger batches
                          are faster but may hit API limits.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    id="batch-size"
                    min={1}
                    max={50}
                    step={1}
                    value={[localConfig.batchSize]}
                    onValueChange={handleBatchSizeChange}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={localConfig.batchSize}
                    onChange={handleBatchSizeInputChange}
                    className="w-16"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delay">Delay Between Batches (ms)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Time to wait between processing batches. Higher values
                          help avoid API rate limits.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    id="delay"
                    min={0}
                    max={2000}
                    step={100}
                    value={[localConfig.delayBetweenBatches]}
                    onValueChange={handleDelayChange}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={10000}
                    value={localConfig.delayBetweenBatches}
                    onChange={handleDelayInputChange}
                    className="w-20"
                  />
                </div>
              </div>

              <Button onClick={handleApply} className="w-full">
                Apply Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
