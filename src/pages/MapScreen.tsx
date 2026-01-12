import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMeasurementStore } from '@/store/measurementStore';
import { getBackendClient } from '@/lib/backend/client';
import { useEffect, useState, useMemo } from 'react';
import { TreeData } from '@/lib/calculations';
import FloatingChatButton from '@/components/FloatingChatButton';
import { Button } from '@/components/ui/button';

interface MasterTree {
  id: number;
  tree_number: number;
  tree_number_in_campus: number;
  actual_height: number;
  actual_diameter: number;
  species: string;
  campus_id: number;
}

// Campus names
const campusNames: { [key: number]: string } = {
  1: 'Cơ sở 1',
  2: 'Cơ sở 2',
  3: 'Cơ sở 3',
};

// Tree positions by campus
const treePositionsByCampus: { [campus: number]: { [tree: number]: { x: number; y: number } } } = {
  // Campus 1 - Original 17 trees
  1: {
    // Column 1 - x: 15% (5 trees)
    1: { x: 15, y: 12 },
    2: { x: 15, y: 30 },
    3: { x: 15, y: 48 },
    4: { x: 15, y: 66 },
    5: { x: 15, y: 84 },
    // Column 2 - x: 38% (3 trees)
    6: { x: 38, y: 25 },
    7: { x: 38, y: 48 },
    8: { x: 38, y: 71 },
    // Column 3 - x: 62% (4 trees)
    9: { x: 62, y: 18 },
    10: { x: 62, y: 40 },
    11: { x: 62, y: 62 },
    12: { x: 62, y: 84 },
    // Column 4 - x: 85% (5 trees)
    13: { x: 85, y: 12 },
    14: { x: 85, y: 30 },
    15: { x: 85, y: 48 },
    16: { x: 85, y: 66 },
    17: { x: 85, y: 84 },
  },
  // Campus 2 - 7 trees (18-24)
  2: {
    18: { x: 15, y: 20 },
    19: { x: 35, y: 20 },
    20: { x: 55, y: 20 },
    21: { x: 75, y: 20 },
    22: { x: 25, y: 55 },
    23: { x: 50, y: 55 },
    24: { x: 75, y: 55 },
  },
  // Campus 3 - 5 trees (25-29)
  3: {
    25: { x: 20, y: 25 },
    26: { x: 50, y: 25 },
    27: { x: 80, y: 25 },
    28: { x: 35, y: 65 },
    29: { x: 65, y: 65 },
  },
};

// Campus-specific elements
const campusElements: { [campus: number]: JSX.Element } = {
  1: (
    <>
      {/* Building placeholder */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-32 h-20 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">TRƯỜNG HỌC</span>
      </div>

      {/* Stage - between trees 6 and 9, at the very top edge */}
      <div 
        className="absolute w-36 h-14 bg-accent/40 rounded-b border border-t-0 border-accent/60 flex items-center justify-center"
        style={{ left: '50%', top: '0', transform: 'translateX(-50%)' }}
      >
        <span className="text-sm text-foreground font-semibold">SÂN KHẤU</span>
      </div>

      {/* Booth - between trees 5 and 8, at the very bottom edge */}
      <div 
        className="absolute w-36 h-14 bg-primary/50 rounded-t border border-b-0 border-primary/70 flex items-center justify-center"
        style={{ left: '26.5%', bottom: '0', transform: 'translateX(-50%)' }}
      >
        <span className="text-sm text-foreground font-semibold">GIAN HÀNG</span>
      </div>
    </>
  ),
  2: (
    <>
      {/* Campus 2 elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-40 h-24 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground text-center">TÒA NHÀ<br/>CƠ SỞ 2</span>
      </div>
    </>
  ),
  3: (
    <>
      {/* Campus 3 elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-40 h-24 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground text-center">TÒA NHÀ<br/>CƠ SỞ 3</span>
      </div>
    </>
  ),
};

const MapScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSelectedTree, selectedTreeId } = useMeasurementStore();
  const [trees, setTrees] = useState<MasterTree[]>([]);
  const [hoveredTree, setHoveredTree] = useState<number | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<number>(() => {
    const saved = localStorage.getItem('selectedCampus');
    return saved ? parseInt(saved) : 2;
  });

  useEffect(() => {
    const fetchTrees = async () => {
      const backend = getBackendClient();
      if (!backend) {
        setTrees([]);
        return;
      }
      
      const { data } = await backend
        .from('master_trees')
        .select('*')
        .order('tree_number');
      
      if (data) {
        setTrees(data);
        
        // Auto-select tree from URL parameter (from QR code)
        const treeParam = searchParams.get('tree');
        if (treeParam) {
          const treeNumber = parseInt(treeParam);
          const matchedTree = data.find(t => t.tree_number === treeNumber);
          if (matchedTree) {
            // Auto-switch to the correct campus
            setSelectedCampus(matchedTree.campus_id || 1);
            localStorage.setItem('selectedCampus', String(matchedTree.campus_id || 1));
            
            const treeData: TreeData = {
              treeNumber: matchedTree.tree_number,
              actualHeight: Number(matchedTree.actual_height),
              actualDiameter: Number(matchedTree.actual_diameter),
              species: matchedTree.species,
            };
            setSelectedTree(matchedTree.tree_number, treeData);
            // Navigate directly to user-info if coming from QR
            navigate('/user-info');
          }
        }
      }
    };
    fetchTrees();
  }, [searchParams, setSelectedTree, navigate]);

  // Save campus selection to localStorage
  useEffect(() => {
    localStorage.setItem('selectedCampus', String(selectedCampus));
  }, [selectedCampus]);

  const handleTreeSelect = (tree: MasterTree) => {
    const treeData: TreeData = {
      treeNumber: tree.tree_number,
      actualHeight: Number(tree.actual_height),
      actualDiameter: Number(tree.actual_diameter),
      species: tree.species,
    };
    setSelectedTree(tree.tree_number, treeData);
    navigate('/user-info');
  };

  // Filter trees by campus
  const filteredTrees = useMemo(() => 
    trees.filter(t => (t.campus_id || 1) === selectedCampus),
    [trees, selectedCampus]
  );

  // Get current campus tree positions
  const currentPositions = treePositionsByCampus[selectedCampus] || {};

  // Memoize grid lines to prevent re-renders
  const gridLines = useMemo(() => (
    <svg className="absolute inset-0 w-full h-full opacity-20">
      {[...Array(10)].map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          y1={`${(i + 1) * 10}%`}
          x2="100%"
          y2={`${(i + 1) * 10}%`}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary"
        />
      ))}
      {[...Array(10)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={`${(i + 1) * 10}%`}
          y1="0"
          x2={`${(i + 1) * 10}%`}
          y2="100%"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary"
        />
      ))}
    </svg>
  ), []);

  // Count trees per campus
  const treeCounts = useMemo(() => {
    const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
    trees.forEach(t => {
      const campusId = t.campus_id || 1;
      counts[campusId] = (counts[campusId] || 0) + 1;
    });
    return counts;
  }, [trees]);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <div className="text-center mb-4 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          BẢN ĐỒ CÂY XANH
        </h1>
        <p className="text-muted-foreground mt-1">
          Chọn một cây để bắt đầu đo
        </p>
      </div>

      {/* Campus selector */}
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {[1, 2, 3].map((campusId) => (
          <Button
            key={campusId}
            variant={selectedCampus === campusId ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCampus(campusId)}
            className="min-w-[100px]"
          >
            {campusNames[campusId]} ({treeCounts[campusId] || 0})
          </Button>
        ))}
      </div>

      {/* Map container */}
      <div className="flex-1 relative glass-card p-4 overflow-hidden animate-scale-in">
        {/* Map background with grid */}
        <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-primary/10 to-background border border-primary/20">
          {/* Grid lines */}
          {gridLines}

          {/* Campus-specific elements */}
          {campusElements[selectedCampus]}

          {/* Tree markers - using CSS transitions instead of Framer Motion */}
          {filteredTrees.map((tree) => {
            const pos = currentPositions[tree.tree_number];
            if (!pos) return null;
            
            const isSelected = selectedTreeId === tree.tree_number;
            const isHovered = hoveredTree === tree.tree_number;
            
            return (
              <button
                key={tree.tree_number}
                className={`tree-marker absolute transition-transform duration-200 ${isSelected ? 'selected' : ''} ${isHovered ? 'scale-110' : ''}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.1)' : 'scale(1)'}`,
                }}
                onClick={() => handleTreeSelect(tree)}
                onMouseEnter={() => setHoveredTree(tree.tree_number)}
                onMouseLeave={() => setHoveredTree(null)}
              >
                <span className={`font-bold text-sm ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>
                  {tree.tree_number_in_campus || tree.tree_number}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tooltip for hovered tree */}
        {hoveredTree && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                         bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30 animate-fade-in">
            <p className="text-sm text-foreground font-medium">
              Cây số {trees.find(t => t.tree_number === hoveredTree)?.tree_number_in_campus || hoveredTree}: {trees.find(t => t.tree_number === hoveredTree)?.species}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
          <span>Cây có thể đo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground" />
          <span>Đã chọn</span>
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default MapScreen;