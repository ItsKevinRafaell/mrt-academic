"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">MRT Academic</CardTitle>
          <CardDescription>Pendaftaran akun baru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Pendaftaran akun dilakukan oleh admin. Silakan hubungi admin untuk didaftarkan.
            </p>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Cara mendaftar:</p>
              <ol className="list-decimal list-inside text-left text-muted-foreground space-y-1">
                <li>Hubungi admin/SUPER_ADMIN</li>
                <li>Berikan NIM, nama lengkap, dan email</li>
                <li>Admin akan mendaftarkan akun Anda</li>
                <li>Login dengan email dan password yang diberikan</li>
              </ol>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Kembali ke Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
