"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types";

interface IPKManagementProps {
  courses: Course[];
}

export function IPKManagement({ courses }: IPKManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Manajemen IPK
        </CardTitle>
        <CardDescription>
          Kelola komponen penilaian dan hitung IPK untuk semua mata kuliah
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Halaman IPK memungkinkan Anda untuk:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Mengatur komponen penilaian (UTS, UAS, Tugas, dll)</li>
          <li>Menetapkan bobot untuk setiap komponen</li>
          <li>Menghitung IPK otomatis berdasarkan nilai</li>
          <li>Export data IPK ke Excel</li>
        </ul>
        <div className="pt-4">
          <Link href="/ipk">
            <Button className="gap-2">
              <Calculator className="h-4 w-4" />
              Buka Kalkulator IPK
            </Button>
          </Link>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Total Mata Kuliah Terdaftar:</p>
          <p className="text-2xl font-bold">{courses.length} mata kuliah</p>
        </div>
      </CardContent>
    </Card>
  );
}
