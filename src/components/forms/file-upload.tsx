export function FileUpload({ name = "file", accept }: { name?: string; accept?: string }) {
  return <input name={name} type="file" accept={accept} className="block w-full text-sm" />;
}
