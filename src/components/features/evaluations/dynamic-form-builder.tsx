import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DynamicFormBuilder() {
  return (
    <div className="rounded-md border bg-white p-4">
      <Input placeholder="Judul section" />
      <Input className="mt-3" placeholder="Pertanyaan" />
      <Button className="mt-3" type="button">Tambah Pertanyaan</Button>
    </div>
  );
}
