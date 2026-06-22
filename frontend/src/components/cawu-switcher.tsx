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
import { CawuManagementDialog } from "@/components/cawu-management-dialog";
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

      // Deduplicate by ID
      const uniqueMap = new Map<number, Cawu>();
      cawusData.forEach((c) => uniqueMap.set(c.id, c));
      const unique = Array.from(uniqueMap.values());
      setCawus(unique);

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
      <div className="flex items-center gap-2">
        <div className="w-40 h-9 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedCawu?.id.toString()}
        onValueChange={handleCawuChange}
      >
        <SelectTrigger className="w-auto min-w-[140px] border-0 bg-primary/5 hover:bg-primary/10 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {cawus.map((cawu) => (
            <SelectItem key={cawu.id} value={cawu.id.toString()}>
              Cawu {cawu.semester}{cawu.is_active ? " (Aktif)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <CawuManagementDialog />
    </div>
  );
}
