import { Input } from "@/components/ui/input";

export function DateRangePicker() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input name="startDate" type="date" />
      <Input name="endDate" type="date" />
    </div>
  );
}
