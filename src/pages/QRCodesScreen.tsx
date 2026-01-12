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
  tree_number_in_campus: number;
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
  const [selectedCampus, setSelectedCampus] = useState<number | null>(2); // default to campus 2
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
        .select("id, tree_number, tree_number_in_campus, species, location_description, campus_id")
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

  const downloadSingleQR = (treeNumber: number, treeNumberInCampus: number, species: string, campusId: number) => {
    const svg = document.getElementById(`qr-${treeNumber}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    qrImg.onload = () => {
      const padding = 32;
      const qrSize = 180;
      const badgeHeight = 32;
      const campusBadgeHeight = 22;
      const questionHeight = 70;
      const speciesHeight = 28;
      const canvasWidth = qrSize + padding * 2 + 20;
      const canvasHeight = padding + campusBadgeHeight + 8 + badgeHeight + 16 + qrSize + 24 + 16 + questionHeight + 16 + speciesHeight + padding;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Beautiful gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      bgGradient.addColorStop(0, "#0f1a0f");
      bgGradient.addColorStop(0.5, "#162116");
      bgGradient.addColorStop(1, "#0f1a0f");
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, canvasWidth, canvasHeight, 20);
      ctx.fill();

      // Subtle inner glow border
      const borderGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      borderGradient.addColorStop(0, "#22c55e40");
      borderGradient.addColorStop(0.5, "#10b98160");
      borderGradient.addColorStop(1, "#22c55e40");
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(2, 2, canvasWidth - 4, canvasHeight - 4, 18);
      ctx.stroke();

      // Decorative leaf accent at corners
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#22c55e50";
      ctx.fillText("🌿", 12, 28);
      ctx.fillText("🌿", canvasWidth - 28, canvasHeight - 16);

      // Campus badge with gradient
      const campusText = campusNames[campusId] || 'Cơ sở 1';
      ctx.font = "bold 11px system-ui, sans-serif";
      const campusTextWidth = ctx.measureText(campusText).width;
      const campusBadgeWidth = campusTextWidth + 24;
      const campusBadgeX = (canvasWidth - campusBadgeWidth) / 2;
      const campusBadgeY = padding - 8;

      const campusGradient = ctx.createLinearGradient(campusBadgeX, campusBadgeY, campusBadgeX + campusBadgeWidth, campusBadgeY + campusBadgeHeight);
      campusGradient.addColorStop(0, "#3b82f6");
      campusGradient.addColorStop(1, "#2563eb");
      ctx.fillStyle = campusGradient;
      ctx.beginPath();
      ctx.roundRect(campusBadgeX, campusBadgeY, campusBadgeWidth, campusBadgeHeight, 11);
      ctx.fill();

      // Campus badge shadow
      ctx.shadowColor = "#3b82f640";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(campusText, canvasWidth / 2, campusBadgeY + campusBadgeHeight / 2);
      ctx.shadowColor = "transparent";

      // Tree number badge with beautiful gradient
      const badgeText = `🌳 Cây số ${treeNumberInCampus || treeNumber}`;
      ctx.font = "bold 15px system-ui, sans-serif";
      const badgeTextWidth = ctx.measureText(badgeText).width;
      const badgeWidth = badgeTextWidth + 36;
      const badgeX = (canvasWidth - badgeWidth) / 2;
      const badgeY = campusBadgeY + campusBadgeHeight + 8;

      const treeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
      treeGradient.addColorStop(0, "#22c55e");
      treeGradient.addColorStop(0.5, "#16a34a");
      treeGradient.addColorStop(1, "#15803d");
      ctx.fillStyle = treeGradient;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 16);
      ctx.fill();

      // Badge glow
      ctx.shadowColor = "#22c55e60";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, canvasWidth / 2, badgeY + badgeHeight / 2);
      ctx.shadowColor = "transparent";

      // QR code container with shadow
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = badgeY + badgeHeight + 16;
      
      // QR shadow
      ctx.shadowColor = "#00000040";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Draw QR code
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Curiosity question box - more attractive design
      const questionY = qrY + qrSize + 24;
      const questionBoxHeight = questionHeight;
      const questionBoxWidth = qrSize + 30;
      const questionBoxX = (canvasWidth - questionBoxWidth) / 2;
      
      // Question box with beautiful gradient
      const questionGradient = ctx.createLinearGradient(questionBoxX, questionY, questionBoxX, questionY + questionBoxHeight);
      questionGradient.addColorStop(0, "#ecfdf5");
      questionGradient.addColorStop(0.5, "#d1fae5");
      questionGradient.addColorStop(1, "#a7f3d0");
      ctx.fillStyle = questionGradient;
      ctx.beginPath();
      ctx.roundRect(questionBoxX, questionY, questionBoxWidth, questionBoxHeight, 14);
      ctx.fill();
      
      // Gradient border for question box
      const qBorderGradient = ctx.createLinearGradient(questionBoxX, questionY, questionBoxX + questionBoxWidth, questionY);
      qBorderGradient.addColorStop(0, "#10b981");
      qBorderGradient.addColorStop(0.5, "#22c55e");
      qBorderGradient.addColorStop(1, "#10b981");
      ctx.strokeStyle = qBorderGradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(questionBoxX, questionY, questionBoxWidth, questionBoxHeight, 14);
      ctx.stroke();
      
      // Main question text with shadow
      ctx.shadowColor = "#16a34a30";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillStyle = "#166534";
      ctx.textAlign = "center";
      ctx.fillText("🌿 Cây này hấp thụ", canvasWidth / 2, questionY + 22);
      ctx.fillText("bao nhiêu CO₂?", canvasWidth / 2, questionY + 40);
      ctx.shadowColor = "transparent";
      
      // Sub text
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillStyle = "#059669";
      ctx.fillText("✨ Quét mã để khám phá! ✨", canvasWidth / 2, questionY + 58);

      // Species name with glow
      const speciesY = questionY + questionBoxHeight + 18;
      const speciesText = species || "Chưa xác định";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.shadowColor = "#22c55e50";
      ctx.shadowBlur = 6;
      ctx.textAlign = "center";
      ctx.fillText(speciesText, canvasWidth / 2, speciesY);
      ctx.shadowColor = "transparent";

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

                {/* Tree Number Badge - use tree_number_in_campus */}
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold mb-4">
                  Cây số {tree.tree_number_in_campus || tree.tree_number}
                </div>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-lg mb-3">
                  <QRCodeSVG
                    id={`qr-${tree.tree_number}`}
                    value={`${baseUrl}/tree/${tree.tree_number}`}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Curiosity question - nature-friendly style */}
                <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/20 border border-green-500/30 px-4 py-3 rounded-xl mb-3 text-center w-full print:bg-green-50 print:border-green-600">
                  <p className="text-base md:text-lg font-bold text-green-700 dark:text-green-400 leading-tight print:text-green-800" style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}>
                    🌿 Cây này hấp thụ bao nhiêu CO₂?
                  </p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 print:text-emerald-700" style={{ fontFamily: "'Quicksand', 'Nunito', sans-serif" }}>
                    ✨ Quét mã để khám phá!
                  </p>
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
                  onClick={() => downloadSingleQR(tree.tree_number, tree.tree_number_in_campus, tree.species || "", tree.campus_id || 1)}
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