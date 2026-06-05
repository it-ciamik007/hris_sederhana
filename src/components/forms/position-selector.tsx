export function PositionSelector({ positions, name = "positionId" }: { positions: { id: string; name: string }[]; name?: string }) {
  return (
    <select name={name} className="h-9 w-full rounded-md border bg-white px-3 text-sm">
      <option value="">Pilih jabatan</option>
      {positions.map((position) => (
        <option key={position.id} value={position.id}>{position.name}</option>
      ))}
    </select>
  );
}
