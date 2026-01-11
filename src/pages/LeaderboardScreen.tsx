import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getBackendClient } from '@/lib/backend/client';
import { useMeasurementStore } from '@/store/measurementStore';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo } from 'react';
import { Trophy, Medal, RefreshCw, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import FloatingChatButton from '@/components/FloatingChatButton';

interface LeaderboardEntry {
  id: string;
  user_name: string;
  user_class: string;
  tree_number: number;
  accuracy_score: number;
  created_at: string;
}

interface MasterTree {
  tree_number: number;
  campus_id: number;
}

// Campus names
const campusNames: { [key: number]: string } = {
  1: 'Cơ sở 1',
  2: 'Cơ sở 2',
  3: 'Cơ sở 3',
};

// Helper to get campus from tree number
const getCampusFromTreeNumber = (treeNumber: number): number => {
  if (treeNumber >= 1 && treeNumber <= 17) return 1;
  if (treeNumber >= 18 && treeNumber <= 24) return 2;
  if (treeNumber >= 25 && treeNumber <= 29) return 3;
  return 1;
};

const LeaderboardScreen = () => {
  const navigate = useNavigate();
  const { treeNumber } = useParams<{ treeNumber: string }>();
  const { reset } = useMeasurementStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [currentTree, setCurrentTree] = useState<number>(treeNumber ? parseInt(treeNumber) : 1);
  const [trees, setTrees] = useState<MasterTree[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<number>(() => 
    getCampusFromTreeNumber(treeNumber ? parseInt(treeNumber) : 1)
  );

  // Fetch trees to know which ones exist
  useEffect(() => {
    const fetchTrees = async () => {
      const backend = getBackendClient();
      if (!backend) return;

      const { data } = await backend
        .from('master_trees')
        .select('tree_number, campus_id')
        .order('tree_number');

      if (data) {
        setTrees(data);
      }
    };
    fetchTrees();
  }, []);

  // Filter trees by campus
  const campusTrees = useMemo(() => 
    trees.filter(t => (t.campus_id || getCampusFromTreeNumber(t.tree_number)) === selectedCampus),
    [trees, selectedCampus]
  );

  // Count trees per campus
  const treeCounts = useMemo(() => {
    const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
    trees.forEach(t => {
      const campusId = t.campus_id || getCampusFromTreeNumber(t.tree_number);
      counts[campusId] = (counts[campusId] || 0) + 1;
    });
    return counts;
  }, [trees]);

  // Auto-navigate back to splash after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          reset();
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, reset]);

  const fetchLeaderboard = async (treeNum: number) => {
    setLoading(true);

    const backend = getBackendClient();
    if (!backend) {
      setEntries([]);
      setLoading(false);
      return;
    }

    // Use masked RPC function to protect student privacy
    const { data, error } = await backend
      .rpc('get_leaderboard_masked', { 
        p_tree_number: treeNum, 
        p_limit: 10 
      });

    if (data && !error) {
      setEntries(data as LeaderboardEntry[]);
    }
    setLoading(false);
  };

  // Update tree from URL param
  useEffect(() => {
    if (treeNumber) {
      const treeNum = parseInt(treeNumber);
      setCurrentTree(treeNum);
      setSelectedCampus(getCampusFromTreeNumber(treeNum));
    }
  }, [treeNumber]);

  // Fetch when tree changes
  useEffect(() => {
    fetchLeaderboard(currentTree);

    const backend = getBackendClient();
    if (!backend) return;

    // Subscribe to realtime updates
    const channel = backend
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard',
        },
        () => {
          fetchLeaderboard(currentTree);
        }
      )
      .subscribe();

    return () => {
      backend.removeChannel(channel);
    };
  }, [currentTree]);

  // When campus changes, switch to first tree of that campus
  useEffect(() => {
    if (campusTrees.length > 0 && !campusTrees.some(t => t.tree_number === currentTree)) {
      const firstTree = campusTrees[0].tree_number;
      setCurrentTree(firstTree);
      navigate(`/leaderboard/${firstTree}`, { replace: true });
    }
  }, [selectedCampus, campusTrees, currentTree, navigate]);

  const handlePlayAgain = () => {
    reset();
    navigate('/');
  };

  const navigateTree = (direction: 'prev' | 'next') => {
    const currentIndex = campusTrees.findIndex(t => t.tree_number === currentTree);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex <= 0 ? campusTrees.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= campusTrees.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newTree = campusTrees[newIndex]?.tree_number || currentTree;
    setCurrentTree(newTree);
    navigate(`/leaderboard/${newTree}`, { replace: true });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-gold" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-silver" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-bronze" />;
    return <span className="w-6 text-center text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gold/10 border-gold/30';
    if (rank === 2) return 'bg-silver/10 border-silver/30';
    if (rank === 3) return 'bg-bronze/10 border-bronze/30';
    return 'bg-muted/30 border-border/50';
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <motion.div
        className="max-w-lg mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-4 sm:mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gold/20 
                          flex items-center justify-center border border-gold/30">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-gold" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Bảng Xếp Hạng
          </h1>
          
          {/* Campus selector */}
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {[1, 2, 3].map((campusId) => (
              <Button
                key={campusId}
                variant={selectedCampus === campusId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCampus(campusId)}
                className="text-xs px-3"
              >
                {campusNames[campusId]} ({treeCounts[campusId] || 0})
              </Button>
            ))}
          </div>

          {/* Tree selector */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTree('prev')}
              className="h-8 w-8"
              disabled={campusTrees.length === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/20 rounded-lg border border-primary/30 min-w-[100px] sm:min-w-[120px]">
              <span className="text-base sm:text-lg font-bold text-primary">Cây số {currentTree}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateTree('next')}
              className="h-8 w-8"
              disabled={campusTrees.length === 0}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs sm:text-sm">
            Top 10 độ chính xác cao nhất
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Trở về màn hình chờ sau {countdown}s
          </p>
        </motion.div>

        {/* Leaderboard table */}
        <motion.div
          className="glass-card p-4 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground mt-2">Đang tải...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có dữ liệu</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hãy là người đầu tiên đo đạc!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-10 gap-2 text-xs text-muted-foreground px-3 pb-2 border-b border-border/50">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Tên</div>
                <div className="col-span-2">Lớp</div>
                <div className="col-span-2 text-right">Độ chính xác</div>
              </div>

              {/* Entries */}
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className={`grid grid-cols-10 gap-2 items-center p-3 rounded-lg border ${getRankBg(index + 1)}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="col-span-5 font-medium text-foreground truncate">
                    {entry.user_name}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {entry.user_class}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`font-bold ${
                      index === 0 ? 'text-gold' : 
                      index === 1 ? 'text-silver' :
                      index === 2 ? 'text-bronze' : 'text-primary'
                    }`}>
                      {entry.accuracy_score}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handlePlayAgain}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Chơi lại
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1 h-12 border-primary text-primary hover:bg-primary/10"
          >
            <Home className="w-5 h-5 mr-2" />
            Về trang chủ
          </Button>
        </motion.div>

        {/* Refresh button */}
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLeaderboard(currentTree)}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default LeaderboardScreen;