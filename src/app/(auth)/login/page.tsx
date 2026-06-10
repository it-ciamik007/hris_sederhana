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
  const email = params?.email ?? "admin@example.com";
  const error = params?.error;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <form action="/api/auth/login" method="post" className="w-full max-w-sm rounded-md border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">HRIS Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengelola data HR.</p>
        </div>
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <label className="mb-3 block text-sm">
          Email
          <Input className="mt-1" name="email" type="email" defaultValue={email} required />
        </label>
        <label className="mb-5 block text-sm">
          Password
          <Input className="mt-1" name="password" type="password" defaultValue="Admin123!" required />
        </label>
        <Button className="w-full" type="submit">
          Login
        </Button>
      </form>
    </main>
  );
}
