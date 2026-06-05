export function DepartmentSelector({ departments, name = "departmentId" }: { departments: { id: string; name: string }[]; name?: string }) {
  return (
    <select name={name} className="h-9 w-full rounded-md border bg-white px-3 text-sm">
      <option value="">Pilih departemen</option>
      {departments.map((department) => (
        <option key={department.id} value={department.id}>{department.name}</option>
      ))}
    </select>
  );
}
