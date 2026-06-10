import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const email = params?.email ?? "";
  const error = params?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form action="/api/auth/login" method="post" className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-primary">HRIS Sederhana</p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">Masuk ke akun Anda</h1>
          <p className="text-sm text-muted-foreground">Gunakan email atau username HRIS yang sudah terdaftar.</p>
        </div>
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <label className="mb-3 block text-sm font-medium text-foreground">
          Email
          <Input className="mt-1" name="email" type="text" defaultValue={email} placeholder="dian@hris.local" autoComplete="username" required />
        </label>
        <label className="mb-5 block text-sm font-medium text-foreground">
          Password
          <Input className="mt-1" name="password" type="password" autoComplete="current-password" required />
        </label>
        <Button className="w-full" type="submit">
          Masuk
        </Button>
      </form>
    </main>
  );
}
