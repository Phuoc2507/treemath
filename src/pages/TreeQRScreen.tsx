import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBackendClient } from "@/lib/backend/client";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, ArrowRight } from "lucide-react";
import FallingLeaves from "@/components/FallingLeaves";
import FloatingChatButton from "@/components/FloatingChatButton";
import { calculateBiomass, calculateCO2Absorbed } from "@/lib/calculations";

interface LeaderboardEntry {
  id: string;
  user_name: string;
  user_class: string;
  accuracy_score: number;
}

const TYPEWRITER_TEXT = "Bạn có biết về sức mạnh của cây xanh? Mỗi cây có thể hấp thụ hàng chục kg CO₂ mỗi năm, góp phần làm mát không khí và bảo vệ môi trường. Hãy cùng đo và khám phá sức mạnh của cây này nhé! 🌍💚";

const TreeQRScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const treeNumber = useMemo(() => {
    const num = parseInt(id || "1");
    return isNaN(num) ? 1 : num;
  }, [id]);

  // Intro states
  const [displayedText, setDisplayedText] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMeasureButton, setShowMeasureButton] = useState(false);
  
  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  
  // Tree CO2 data
  const [treeCO2, setTreeCO2] = useState<number | null>(null);
  const [treeSpecies, setTreeSpecies] = useState<string | null>(null);

  // Typewriter effect - optimized with RAF
  useEffect(() => {
    let index = 0;
    let animationId: number;
    let lastTime = 0;
    const charDelay = 30;
    
    const animate = (time: number) => {
      if (time - lastTime >= charDelay) {
        if (index < TYPEWRITER_TEXT.length) {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, index + 1));
          index++;
          lastTime = time;
        } else {
          setTimeout(() => setShowLeaderboard(true), 300);
          return;
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

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
      const { data, error } = await supabase
        .from('master_trees')
        .select('actual_height, actual_diameter, species')
        .eq('tree_number', treeNumber)
        .single();
      
      if (!error && data && data.actual_height && data.actual_diameter) {
        const biomass = calculateBiomass(data.actual_diameter, data.actual_height);
        const co2 = calculateCO2Absorbed(biomass);
        setTreeCO2(Math.round(co2 * 10) / 10);
        setTreeSpecies(data.species);
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
    // Navigate directly to user-info page with tree number
    navigate(`/user-info?tree=${treeNumber}`);
  };

  // Helper to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
      <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4 animate-fade-in relative z-10">
        <div className="relative mb-4">
          {/* Outer glow ring */}
          <div className="absolute inset-[-8px] bg-gradient-to-br from-primary/40 to-forest/30 rounded-full blur-xl animate-pulse" />
          {/* Main icon container */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 via-forest/30 to-leaf/30 flex items-center justify-center border-2 border-primary/50 shadow-2xl">
            <TreeDeciduous className="w-12 h-12 text-primary drop-shadow-lg" />
          </div>
          {/* Sparkle accents */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full blur-sm animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-leaf rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Tree number badge */}
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/30 via-forest/25 to-primary/30 text-primary px-6 py-3 rounded-full shadow-lg border border-primary/40">
          <span className="text-2xl">🌳</span>
          <span className="text-xl font-bold tracking-wide">Cây số {treeNumber}</span>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col relative z-10 overflow-y-auto">
        {/* CO2 Highlight Card */}
        <div className="glass-premium p-6 mb-6 animate-fade-in">
          {/* Tree species */}
          {treeSpecies && (
            <p className="text-center text-muted-foreground text-base mb-3">
              {treeSpecies}
            </p>
          )}
          
          {/* Main stat highlight */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="stat-highlight">
              <span className="text-4xl font-extrabold text-primary text-glow">
                {treeCO2 !== null ? treeCO2.toLocaleString('vi-VN') : '...'}
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">kg CO₂</span>
                <span className="text-sm text-muted-foreground">đã hấp thụ</span>
              </div>
            </div>
          </div>
          
          {/* Description text */}
          <p className="text-foreground text-lg leading-relaxed text-center">
            {displayedText}
            {displayedText.length < TYPEWRITER_TEXT.length && (
              <span className="animate-pulse text-primary ml-0.5">|</span>
            )}
          </p>
          
          {/* CO2 absorbed highlight */}
          {treeCO2 !== null && (
            <div className="mt-4 pt-4 border-t border-primary/20 text-center">
              <p className="text-xl font-bold text-primary">
                🌿 Đã hấp thụ <span className="text-2xl">{treeCO2.toLocaleString('vi-VN')}</span> kg CO₂
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="glass-premium p-5 mb-6 animate-fade-in">
            <h3 className="text-foreground font-bold text-center mb-5 text-xl flex items-center justify-center gap-3">
              <span className="text-3xl">🏆</span>
              <span>Bảng xếp hạng</span>
            </h3>

            {leaderboardLoading ? (
              <div className="text-muted-foreground text-center py-6 text-base">Đang tải...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-muted-foreground text-base">
                  Chưa có ai đo cây này
                </p>
                <p className="text-primary font-semibold text-lg mt-1">
                  Hãy là người đầu tiên!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                      index === 0 ? "rank-gold scale-[1.02]" :
                      index === 1 ? "rank-silver" :
                      "rank-bronze"
                    }`}
                  >
                    {/* Medal Badge */}
                    <div className={`relative flex-shrink-0 ${index === 0 ? 'scale-110' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl ${
                        index === 0 ? 'glow-gold' : ''
                      }`}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                    </div>
                    
                    {/* Avatar */}
                    <div className={`avatar-ring w-11 h-11 flex-shrink-0 ${
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
                        index === 0 ? 'text-lg text-glow-gold text-gold' : 'text-base text-foreground'
                      }`}>
                        {entry.user_name}
                      </p>
                      <p className="text-muted-foreground text-sm truncate">{entry.user_class}</p>
                    </div>
                    
                    {/* Score */}
                    <div className={`px-4 py-2 rounded-xl ${
                      index === 0 
                        ? 'bg-gradient-to-r from-gold/30 to-gold/20 border border-gold/40' 
                        : 'bg-primary/20 border border-primary/30'
                    }`}>
                      <span className={`font-extrabold text-lg ${
                        index === 0 ? 'text-gold text-glow-gold' : 'text-primary'
                      }`}>
                        {entry.accuracy_score.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA Button */}
      {showMeasureButton && (
        <div className="p-6 animate-fade-in relative z-10">
          <button
            onClick={handleStartMeasure}
            className="btn-cta w-full py-5 text-xl text-primary-foreground flex items-center justify-center gap-3 animate-breathe"
          >
            <span>🌳</span>
            <span>Bắt đầu đo cây</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default TreeQRScreen;
