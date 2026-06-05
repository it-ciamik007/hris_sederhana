export function EmployeeSelector({ employees, name = "employeeId" }: { employees: { id: string; fullName: string }[]; name?: string }) {
  return (
    <select name={name} className="h-9 w-full rounded-md border bg-white px-3 text-sm">
      <option value="">Pilih karyawan</option>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>{employee.fullName}</option>
      ))}
    </select>
  );
}
