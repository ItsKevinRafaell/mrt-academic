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

      // Set active cawu as default if no cawu selected
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
      <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <Select
      value={selectedCawu?.id.toString()}
      onValueChange={handleCawuChange}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Pilih Cawu" />
      </SelectTrigger>
      <SelectContent>
        {cawus.map((cawu) => (
          <SelectItem key={cawu.id} value={cawu.id.toString()}>
            {cawu.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
