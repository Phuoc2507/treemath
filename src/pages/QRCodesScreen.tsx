import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getBackendClient } from "@/lib/backend/client";
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface MasterTree {
  id: number;
  tree_number: number;
  species: string;
  location_description: string | null;
  campus_id: number;
}

// Campus names
const campusNames: { [key: number]: string } = {
  1: 'Cơ sở 1',
  2: 'Cơ sở 2',
  3: 'Cơ sở 3',
};

const QRCodesScreen = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<MasterTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<number | null>(null); // null = all
  const printRef = useRef<HTMLDivElement>(null);

  // Get base URL for QR codes
  const baseUrl = window.location.origin;

  useEffect(() => {
    const fetchTrees = async () => {
      setIsLoading(true);

      const backend = getBackendClient();
      if (!backend) {
        setTrees([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await backend
        .from("master_trees")
        .select("id, tree_number, species, location_description, campus_id")
        .order("tree_number");

      if (!error && data) {
        setTrees(data);
      }
      setIsLoading(false);
    };

    fetchTrees();
  }, []);

  // Filter trees by campus
  const filteredTrees = selectedCampus === null 
    ? trees 
    : trees.filter(t => (t.campus_id || 1) === selectedCampus);

  // Count trees per campus
  const treeCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
  trees.forEach(t => {
    const campusId = t.campus_id || 1;
    treeCounts[campusId] = (treeCounts[campusId] || 0) + 1;
  });

  const handlePrint = () => {
    window.print();
  };

  const downloadSingleQR = (treeNumber: number, species: string, campusId: number) => {
    const svg = document.getElementById(`qr-${treeNumber}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    qrImg.onload = () => {
      const padding = 40;
      const qrSize = 200;
      const badgeHeight = 36;
      const campusBadgeHeight = 24;
      const speciesHeight = 30;
      const canvasWidth = qrSize + padding * 2;
      const canvasHeight = campusBadgeHeight + 10 + badgeHeight + 20 + qrSize + 20 + speciesHeight + padding;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark background with rounded corners
      ctx.fillStyle = "#1a1f1a";
      ctx.beginPath();
      ctx.roundRect(0, 0, canvasWidth, canvasHeight, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = "#2d3b2d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1, 1, canvasWidth - 2, canvasHeight - 2, 16);
      ctx.stroke();

      // Campus badge (smaller, at top)
      const campusText = campusNames[campusId] || 'Cơ sở 1';
      ctx.font = "bold 11px sans-serif";
      const campusTextWidth = ctx.measureText(campusText).width;
      const campusBadgeWidth = campusTextWidth + 20;
      const campusBadgeX = (canvasWidth - campusBadgeWidth) / 2;
      const campusBadgeY = 15;

      ctx.fillStyle = "#3b82f6"; // Blue for campus
      ctx.beginPath();
      ctx.roundRect(campusBadgeX, campusBadgeY, campusBadgeWidth, campusBadgeHeight, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(campusText, canvasWidth / 2, campusBadgeY + campusBadgeHeight / 2);

      // Green badge for tree number
      const badgeText = `Cây số ${treeNumber}`;
      ctx.font = "bold 14px sans-serif";
      const badgeTextWidth = ctx.measureText(badgeText).width;
      const badgeWidth = badgeTextWidth + 32;
      const badgeX = (canvasWidth - badgeWidth) / 2;
      const badgeY = campusBadgeY + campusBadgeHeight + 10;

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, canvasWidth / 2, badgeY + badgeHeight / 2);

      // White background for QR
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = badgeY + badgeHeight + 20;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8);
      ctx.fill();

      // Draw QR code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Species name
      const speciesText = species || "Chưa xác định";
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#22c55e";
      ctx.textAlign = "center";
      ctx.fillText(speciesText, canvasWidth / 2, qrY + qrSize + 30);

      // Download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `tree-${treeNumber}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    qrImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">QR Codes - Tree-Math</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredTrees.length} cây • In ra và dán lên bảng thông tin
                </p>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              In tất cả
            </Button>
          </div>

          {/* Campus filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCampus === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCampus(null)}
            >
              Tất cả ({trees.length})
            </Button>
            {[1, 2, 3].map((campusId) => (
              <Button
                key={campusId}
                variant={selectedCampus === campusId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCampus(campusId)}
              >
                {campusNames[campusId]} ({treeCounts[campusId] || 0})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* QR Grid */}
      <div ref={printRef} className="max-w-6xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Đang tải danh sách cây...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
            {filteredTrees.map((tree, index) => (
              <motion.div
                key={tree.tree_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 flex flex-col items-center print:break-inside-avoid print:border-2 print:border-black"
              >
                {/* Campus Badge */}
                <div className="bg-blue-500/20 text-blue-400 px-3 py-0.5 rounded-full text-xs font-medium mb-2">
                  {campusNames[tree.campus_id || 1]}
                </div>

                {/* Tree Number Badge */}
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold mb-4">
                  Cây số {tree.tree_number}
                </div>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-lg mb-4">
                  <QRCodeSVG
                    id={`qr-${tree.tree_number}`}
                    value={`${baseUrl}/tree/${tree.tree_number}`}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Tree Info */}
                <div className="text-center mb-3">
                  <p className="font-semibold text-foreground">{tree.species || "Chưa xác định"}</p>
                  {tree.location_description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {tree.location_description}
                    </p>
                  )}
                </div>

                {/* URL Preview */}
                <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono print:text-[10px]">
                  /tree/{tree.tree_number}
                </p>

                {/* Download button - Hidden when printing */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 print:hidden"
                  onClick={() => downloadSingleQR(tree.tree_number, tree.species || "", tree.campus_id || 1)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Tải PNG
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-black text-center text-sm">
          <p className="font-bold">Tree-Math - Đo lường sức mạnh cây xanh</p>
          <p>Quét mã QR để xem bảng xếp hạng và tham gia đo cây!</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodesScreen;