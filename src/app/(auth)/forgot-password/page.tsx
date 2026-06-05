import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form className="w-full max-w-sm rounded-md border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold">Reset Password</h1>
        <Input type="email" placeholder="email@perusahaan.com" />
        <Button className="mt-4 w-full" type="button">
          Kirim Instruksi
        </Button>
      </form>
    </main>
  );
}
