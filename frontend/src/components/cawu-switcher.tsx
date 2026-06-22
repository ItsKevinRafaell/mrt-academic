"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getCawus, getActiveCawu } from "@/lib/api/cawu";
import { useCawuStore } from "@/lib/stores/cawu-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cawu } from "@/lib/api/cawu";

export function CawuSwitcher() {
  const { selectedCawu, cawus, setSelectedCawu, setCawus } = useCawuStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCawus();
  }, []);

  async function loadCawus() {
    try {
      const [cawusData, activeCawu] = await Promise.all([
        getCawus(),
        getActiveCawu(),
      ]);

      setCawus(cawusData);

      if (!selectedCawu && activeCawu) {
        setSelectedCawu(activeCawu);
      } else if (!selectedCawu && cawusData.length > 0) {
        setSelectedCawu(cawusData[0]);
      }
    } catch (error) {
      console.error("Failed to load cawus:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCawuChange(cawuId: string) {
    const cawu = cawus.find((c) => c.id === parseInt(cawuId));
    if (cawu) {
      setSelectedCawu(cawu);
    }
  }

  if (isLoading || cawus.length === 0) {
    return (
      <div className="w-40 h-9 bg-muted animate-pulse rounded-lg" />
    );
  }

  return (
    <Select
      value={selectedCawu?.id.toString()}
      onValueChange={handleCawuChange}
    >
      <SelectTrigger className="w-auto min-w-[140px] border-0 bg-primary/5 hover:bg-primary/10 focus:ring-0 focus:ring-offset-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">
            {selectedCawu ? `Cawu ${selectedCawu.semester}` : "Pilih Cawu"}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent>
        {cawus.map((cawu) => (
          <SelectItem key={cawu.id} value={cawu.id.toString()}>
            <div className="flex items-center gap-2">
              <span className={cawu.id === selectedCawu?.id ? "text-primary font-semibold" : ""}>
                Cawu {cawu.semester}
              </span>
              {cawu.is_active && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Aktif
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
