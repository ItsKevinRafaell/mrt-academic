'use client';

import { Card } from '@/components/ui/card';
import { BookOpen, Users, FileText, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/curriculum">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Manajemen Akademik</h2>
                <p className="text-sm text-muted-foreground">Kelola mata kuliah, topik, dan sesi</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/bank-soal">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Bank Soal & Simulasi</h2>
                <p className="text-sm text-muted-foreground">Arsip soal dan simulasi CBT</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Manajemen Warga</h2>
                <p className="text-sm text-muted-foreground">Kelola pengguna dan kelompok</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/monitoring">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Monitoring</h2>
                <p className="text-sm text-muted-foreground">Pantau progres dan aktivitas</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
