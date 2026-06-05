import { ScanText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NumberSequenceScanner } from "@/components/features/tests/number-sequence-scanner";

export default function TestScanPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ScanText className="h-4 w-4" />OCR Checker</>}
        title="Scan OCR Deret Angka"
        description="Scan dari kamera ponsel, baca angka, lalu tandai nilai yang keluar dari pola naik atau turun."
      />
      <NumberSequenceScanner />
    </div>
  );
}
