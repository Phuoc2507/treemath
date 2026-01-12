import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackendClient } from "@/lib/backend/client";
import { TreeDeciduous, ArrowRight, Sparkles } from "lucide-react";
import FallingLeaves from "@/components/FallingLeaves";
import FloatingChatButton from "@/components/FloatingChatButton";
import { calculateBiomass, calculateCO2Absorbed, getCO2Equivalents } from "@/lib/calculations";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  id: string;
  user_name: string;
  user_class: string;
  accuracy_score: number;
}

// Campus names
const campusNames: { [key: number]: string } = {
  1: 'Cơ sở 1',
  2: 'Cơ sở 2',
  3: 'Cơ sở 3',
};

// Curiosity questions sequence
const CURIOSITY_QUESTIONS = [
  { emoji: "🤔", text: "Bạn có biết cây này đã sống bao lâu?" },
  { emoji: "🌍", text: "Nó đã hấp thụ bao nhiêu CO₂?" },
  { emoji: "🏆", text: "Ai là người đo chính xác nhất?" },
];

const TreeQRScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const treeNumber = useMemo(() => {
    const num = parseInt(id || "1");
    return isNaN(num) ? 1 : num;
  }, [id]);

  // Animation states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [displayedCO2, setDisplayedCO2] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMeasureButton, setShowMeasureButton] = useState(false);
  
  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  
  // Tree data
  const [treeCO2, setTreeCO2] = useState<number | null>(null);
  const [treeSpecies, setTreeSpecies] = useState<string | null>(null);
  const [treeCampusId, setTreeCampusId] = useState<number>(1);
  const [treeNumberInCampus, setTreeNumberInCampus] = useState<number | null>(null);

  // Question sequence animation
  useEffect(() => {
    const questionTimer = setInterval(() => {
      setCurrentQuestionIndex(prev => {
        if (prev < CURIOSITY_QUESTIONS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(questionTimer);
          setTimeout(() => setShowAnswer(true), 500);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(questionTimer);
  }, []);

  // Count up animation for CO2
  useEffect(() => {
    if (showAnswer && treeCO2 !== null && treeCO2 > 0) {
      const duration = 1500;
      const steps = 40;
      const increment = treeCO2 / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= treeCO2) {
          setDisplayedCO2(treeCO2);
          clearInterval(timer);
          // Show leaderboard after count up
          setTimeout(() => setShowLeaderboard(true), 500);
        } else {
          setDisplayedCO2(Math.round(current * 10) / 10);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [showAnswer, treeCO2]);

  // Show measure button after leaderboard appears
  useEffect(() => {
    if (showLeaderboard) {
      const timer = setTimeout(() => setShowMeasureButton(true), 500);
      return () => clearTimeout(timer);
    }
  }, [showLeaderboard]);

  // Fetch tree data for CO2 calculation
  useEffect(() => {
    const fetchTreeData = async () => {
      const backend = getBackendClient();
      if (!backend) return;
      
      const { data, error } = await backend
        .from('master_trees')
        .select('actual_height, actual_diameter, species, campus_id, tree_number_in_campus')
        .eq('tree_number', treeNumber)
        .single();
      
      if (!error && data && data.actual_height && data.actual_diameter) {
        const biomass = calculateBiomass(data.actual_diameter, data.actual_height);
        const co2 = calculateCO2Absorbed(biomass);
        setTreeCO2(Math.round(co2 * 10) / 10);
        setTreeSpecies(data.species);
        setTreeCampusId(data.campus_id || 1);
        setTreeNumberInCampus(data.tree_number_in_campus);
      }
    };
    
    fetchTreeData();
  }, [treeNumber]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (isNaN(treeNumber)) return;
      
      setLeaderboardLoading(true);

      const backend = getBackendClient();
      if (!backend) {
        setLeaderboard([]);
        setLeaderboardLoading(false);
        return;
      }

      const { data, error } = await backend
        .rpc('get_leaderboard_masked', { 
          p_tree_number: treeNumber, 
          p_limit: 5 
        });

      if (!error && data) {
        setLeaderboard(data as LeaderboardEntry[]);
      }
      setLeaderboardLoading(false);
    };

    fetchLeaderboard();
  }, [treeNumber]);

  const handleStartMeasure = () => {
    navigate(`/user-info?tree=${treeNumber}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCO2Display = (co2Kg: number): { value: string; unit: string } => {
    if (co2Kg >= 1000) {
      const tons = co2Kg / 1000;
      const formatted = Number.isInteger(tons) 
        ? tons.toString() 
        : tons.toFixed(2).replace('.', ',');
      return { value: formatted, unit: 'tấn CO₂' };
    }
    const formatted = Number.isInteger(co2Kg) 
      ? co2Kg.toString() 
      : co2Kg.toFixed(1).replace('.', ',');
    return { value: formatted, unit: 'kg CO₂' };
  };

  const displayTreeNumber = treeNumberInCampus || treeNumber;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-forest/10 to-background flex flex-col relative overflow-hidden">
      <FallingLeaves />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-5 w-48 h-48 bg-leaf/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
      </div>

      {/* Header with Tree Illustration */}
      <div className="flex flex-col items-center justify-center pt-6 sm:pt-8 pb-3 sm:pb-4 px-4 animate-fade-in relative z-10">
        <div className="relative mb-3 sm:mb-4">
          {/* Outer glow ring */}
          <div className="absolute inset-[-6px] sm:inset-[-8px] bg-gradient-to-br from-primary/40 to-forest/30 rounded-full blur-xl animate-pulse" />
          {/* Main icon container */}
          <div className="relative w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/40 via-forest/30 to-leaf/30 flex items-center justify-center border-2 border-primary/50 shadow-2xl">
            <TreeDeciduous className="w-9 h-9 sm:w-12 sm:h-12 text-primary drop-shadow-lg" />
          </div>
          {/* Sparkle accents */}
          <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gold rounded-full blur-sm animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-leaf rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Campus badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium mb-2">
          📍 {campusNames[treeCampusId]}
        </div>

        {/* Tree number badge */}
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-primary/30 via-forest/25 to-primary/30 text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border border-primary/40">
          <span className="text-xl sm:text-2xl">🌳</span>
          <span className="text-lg sm:text-xl font-bold tracking-wide">Cây số {displayTreeNumber}</span>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-5 flex flex-col relative z-10 overflow-y-auto">
        {/* Curiosity Questions Sequence */}
        <div className="glass-premium p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in min-h-[200px] flex flex-col justify-center">
          {/* Tree species */}
          {treeSpecies && (
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
              {treeSpecies}
            </p>
          )}

          {/* Questions Animation */}
          <AnimatePresence mode="wait">
            {!showAnswer && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="text-center py-6"
              >
                <motion.div 
                  className="text-5xl sm:text-6xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {CURIOSITY_QUESTIONS[currentQuestionIndex].emoji}
                </motion.div>
                <p className="text-lg sm:text-xl font-medium text-foreground">
                  {CURIOSITY_QUESTIONS[currentQuestionIndex].text}
                </p>
                
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {CURIOSITY_QUESTIONS.map((_, idx) => (
                    <motion.div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${idx <= currentQuestionIndex ? 'bg-primary' : 'bg-muted'}`}
                      animate={idx === currentQuestionIndex ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer Reveal with Count Up */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-center"
              >
                {/* Sparkle effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mb-3"
                >
                  <Sparkles className="w-6 h-6 text-gold animate-pulse" />
                </motion.div>
                
                {/* Main CO2 stat with count up */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
                  <div className="stat-highlight">
                    <motion.span 
                      className="text-4xl sm:text-5xl font-extrabold text-primary text-glow"
                      animate={{ scale: displayedCO2 === treeCO2 ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {formatCO2Display(displayedCO2).value}
                    </motion.span>
                    <div className="flex flex-col ml-2">
                      <span className="text-lg sm:text-xl font-bold text-foreground">
                        {formatCO2Display(treeCO2 || 0).unit}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">đã hấp thụ!</span>
                    </div>
                  </div>
                </div>

                {/* Celebration text */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-lg text-foreground leading-relaxed"
                >
                  🌍 Cây này đang góp phần làm mát không khí và bảo vệ Trái Đất!
                </motion.p>

                {/* CO2 equivalents */}
                {treeCO2 !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 pt-4 border-t border-primary/20"
                  >
                    <p className="text-center text-xs sm:text-sm text-muted-foreground mb-3">Tương đương với:</p>
                    <ul className="space-y-2 text-left text-sm sm:text-base">
                      <motion.li 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 text-foreground"
                      >
                        <span>🚗</span>
                        <span><strong>{getCO2Equivalents(treeCO2).carDays.toLocaleString('vi-VN')}</strong> ngày khí thải xe hơi</span>
                      </motion.li>
                      <motion.li 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center gap-2 text-foreground"
                      >
                        <span>📱</span>
                        <span><strong>{getCO2Equivalents(treeCO2).phoneCharges.toLocaleString('vi-VN')}</strong> lần sạc điện thoại</span>
                      </motion.li>
                      <motion.li 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-2 text-foreground"
                      >
                        <span>♻️</span>
                        <span><strong>{getCO2Equivalents(treeCO2).plasticBottles.toLocaleString('vi-VN')}</strong> chai nhựa sản xuất</span>
                      </motion.li>
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-premium p-4 sm:p-5 mb-4 sm:mb-6"
            >
              <h3 className="text-foreground font-bold text-center mb-4 sm:mb-5 text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">🏆</span>
                <span>Bảng xếp hạng</span>
              </h3>

              {leaderboardLoading ? (
                <div className="text-muted-foreground text-center py-4 sm:py-6 text-sm sm:text-base">Đang tải...</div>
              ) : leaderboard.length === 0 ? (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-center py-4 sm:py-6"
                >
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎯</div>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Chưa có ai đo cây này
                  </p>
                  <motion.p 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-primary font-semibold text-base sm:text-lg mt-1"
                  >
                    Hãy là người đầu tiên!
                  </motion.p>
                </motion.div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                        index === 0 ? "rank-gold scale-[1.02]" :
                        index === 1 ? "rank-silver" :
                        "rank-bronze"
                      }`}
                    >
                      {/* Medal Badge */}
                      <div className={`relative flex-shrink-0 ${index === 0 ? 'scale-110' : ''}`}>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-2xl sm:text-3xl ${
                          index === 0 ? 'glow-gold' : ''
                        }`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                      </div>
                      
                      {/* Avatar */}
                      <div className={`avatar-ring w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 text-xs sm:text-sm ${
                        index === 0 ? 'border-gold/70 bg-gradient-to-br from-gold/30 to-gold/10' : 
                        index === 1 ? 'border-silver/70 bg-gradient-to-br from-silver/30 to-silver/10' :
                        'border-bronze/70 bg-gradient-to-br from-bronze/30 to-bronze/10'
                      }`}>
                        <span className={`${
                          index === 0 ? 'text-gold' : 
                          index === 1 ? 'text-silver' : 
                          'text-bronze'
                        } font-bold`}>
                          {getInitials(entry.user_name)}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${
                          index === 0 ? 'text-base sm:text-lg text-glow-gold text-gold' : 'text-sm sm:text-base text-foreground'
                        }`}>
                          {entry.user_name}
                        </p>
                        <p className="text-muted-foreground text-xs sm:text-sm truncate">{entry.user_class}</p>
                      </div>
                      
                      {/* Score */}
                      <div className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl ${
                        index === 0 
                          ? 'bg-gradient-to-r from-gold/30 to-gold/20 border border-gold/40' 
                          : 'bg-primary/20 border border-primary/30'
                      }`}>
                        <span className={`font-extrabold text-base sm:text-lg ${
                          index === 0 ? 'text-gold text-glow-gold' : 'text-primary'
                        }`}>
                          {entry.accuracy_score.toFixed(0)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <AnimatePresence>
        {showMeasureButton && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="p-4 sm:p-6 relative z-10"
          >
            <button
              onClick={handleStartMeasure}
              className="btn-cta w-full py-4 sm:py-5 text-lg sm:text-xl text-primary-foreground flex items-center justify-center gap-2 sm:gap-3 animate-breathe"
            >
              <span>🌳</span>
              <span>Bắt đầu đo cây</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default TreeQRScreen;
