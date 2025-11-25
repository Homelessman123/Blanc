import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Mail, Phone, X, MapPin } from 'lucide-react';
import type { User } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

interface MatchedTeammate extends User {
  matchScore?: number;
  matchPercent?: number;
  matchReasons: string[];
  commonInterests: string[];
  commonTalents: string[];
  complementaryTalents: string[];
  complementCategories?: string[];
  supplyDemand?: {
    teammateFillsYourNeeds: string[];
    youFillTheirNeeds: string[];
  };
}

interface TeammateRecommendationProps {
  token: string | null;
  onTeammateClick?: (teammate: MatchedTeammate) => void;
}

const safeList = (value: unknown) => (Array.isArray(value) ? value.filter(Boolean) : []);

const computePercent = (teammate: MatchedTeammate) => {
  const raw = teammate.matchPercent ?? (teammate.matchScore ? Math.min(100, Math.round((teammate.matchScore / 30) * 100)) : 0);
  return Math.max(40, Math.min(98, raw));
};

const TeammateRecommendation: React.FC<TeammateRecommendationProps> = ({ token, onTeammateClick }) => {
  const [teammates, setTeammates] = useState<MatchedTeammate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeammate, setSelectedTeammate] = useState<MatchedTeammate | null>(null);

  // Lock body scroll when the detail modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (selectedTeammate) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [selectedTeammate]);

  useEffect(() => {
    fetchTeammateRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchTeammateRecommendations = async () => {
    if (!token) {
      setTeammates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/recommendations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const payload = await response.json();
        const normalized: MatchedTeammate[] = (payload.recommendations ?? []).map((item: MatchedTeammate) => ({
          ...item,
          matchReasons: item.matchReasons ?? [],
          commonInterests: item.commonInterests ?? [],
          commonTalents: item.commonTalents ?? [],
          complementaryTalents: item.complementaryTalents ?? [],
          supplyDemand: {
            teammateFillsYourNeeds: item.supplyDemand?.teammateFillsYourNeeds ?? [],
            youFillTheirNeeds: item.supplyDemand?.youFillTheirNeeds ?? [],
          },
        }));
        setTeammates(normalized.slice(0, 4));
      } else {
        setTeammates([]);
      }
    } catch (error) {
      console.error('Fetch teammate recommendations error:', error);
      setTeammates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (teammate: MatchedTeammate) => {
    setSelectedTeammate(teammate);
    onTeammateClick?.(teammate);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-3">
          <div className="h-4 w-4 bg-white rounded-full animate-bounce"></div>
          <div className="h-4 w-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></div>
          <div className="h-4 w-4 bg-white rounded-full animate-bounce [animation-delay:300ms]"></div>
        </div>
      </div>
    );
  }

  if (teammates.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  Đồng đội ăn ý cho bạn
                  <TrendingUp className="w-5 h-5 animate-bounce" />
                </h3>
                <p className="text-white/90 text-sm">Dựa trên sở thích, năng khiếu và kỹ năng bổ trợ</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teammates.map((teammate, index) => {
              const percentage = computePercent(teammate);
              const reasons = teammate.matchReasons ?? [];
              const tags = [
                ...safeList(teammate.commonInterests).slice(0, 2),
                ...safeList(teammate.commonTalents).slice(0, 1),
                ...safeList(teammate.complementaryTalents).slice(0, 1),
              ].filter(Boolean);

              return (
                <motion.div
                  key={teammate.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => handleOpenDetail(teammate)}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 cursor-pointer group hover:shadow-2xl transition-all flex flex-col h-full border border-white/50"
                >
                  <div className="relative mb-3">
                    <div
                      className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-2xl transition-shadow"
                      style={{
                        backgroundColor: teammate.profileColor || '#6366f1',
                        backgroundImage: teammate.profileGif ? `url(${teammate.profileGif})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!teammate.profileGif && (teammate.displayName || teammate.name || 'U')[0]}
                    </div>

                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {percentage}%
                    </div>
                  </div>

                  <h4 className="text-center text-gray-900 font-bold text-sm mb-1 line-clamp-1">
                    {teammate.displayName || teammate.name}
                  </h4>
                  <p className="text-center text-[11px] text-gray-500 mb-1 line-clamp-1">
                    {teammate.location || 'Đang cập nhật vị trí'}
                  </p>

                  <div className="h-10 mb-2">
                    {reasons.length > 0 && (
                      <p className="text-center text-xs text-gray-600 line-clamp-2">{reasons[0]}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center min-h-[38px] overflow-hidden">
                    {tags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-medium h-fit border border-indigo-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex-grow"></div>

                  <div className="mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-center text-xs text-indigo-600 font-semibold flex items-center justify-center gap-1">
                      Nhấn để xem chi tiết
                      <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </motion.div>

      {selectedTeammate && (
        <TeammateDetailModal
          teammate={selectedTeammate}
          onClose={() => setSelectedTeammate(null)}
          percentage={computePercent(selectedTeammate)}
        />
      )}
    </>
  );
};

const TeammateDetailModal: React.FC<{
  teammate: MatchedTeammate;
  percentage: number;
  onClose: () => void;
}> = ({ teammate, percentage, onClose }) => {
  const supplyForYou = useMemo(
    () => safeList(teammate.supplyDemand?.teammateFillsYourNeeds).slice(0, 4),
    [teammate.supplyDemand?.teammateFillsYourNeeds]
  );
  const supplyYouGive = useMemo(
    () => safeList(teammate.supplyDemand?.youFillTheirNeeds).slice(0, 4),
    [teammate.supplyDemand?.youFillTheirNeeds]
  );
  const shared = useMemo(
    () => [...safeList(teammate.commonInterests), ...safeList(teammate.commonTalents)].slice(0, 6),
    [teammate.commonInterests, teammate.commonTalents]
  );

  const complementary = useMemo(
    () => [...safeList(teammate.complementaryTalents), ...supplyForYou].slice(0, 6),
    [teammate.complementaryTalents, supplyForYou]
  );

  return (
    <div
      className="fixed inset-0 z-[1000000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 overflow-y-auto min-h-screen"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="relative z-[1000001] bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white shadow hover:bg-gray-50 text-gray-600"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          className="absolute top-4 left-4 inline-flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/30 font-semibold text-sm"
          onClick={onClose}
          aria-label="Quay lại"
        >
          ← Quay lại
        </button>

        <div className="p-6 pt-14 md:pt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{
                  backgroundColor: teammate.profileColor || '#6366f1',
                  backgroundImage: teammate.profileGif ? `url(${teammate.profileGif})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!teammate.profileGif && (teammate.displayName || teammate.name || 'U')[0]}
              </div>
              <div>
                <h4 className="text-xl font-bold">{teammate.displayName || teammate.name}</h4>
                {teammate.futureMajor && <p className="text-sm text-white/80">Định hướng: {teammate.futureMajor}</p>}
                <p className="text-xs text-white/70">{teammate.matchReasons?.[0]}</p>
                {teammate.location && (
                  <p className="text-xs text-white/80 mt-1">📍 {teammate.location}</p>
                )}
              </div>
            </div>

            <div className="bg-white text-emerald-600 font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {percentage}% ăn ý
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <InfoCard title="Bổ trợ bạn ở" highlight items={complementary} fallback="Hồ sơ này mang lại góc nhìn khác với bạn." />
            <InfoCard title="Điểm chung" items={shared} fallback="Chưa có thông tin trùng nhau, nhưng vẫn đáng thử kết nối." />
            <InfoCard title="Bạn giúp họ" items={supplyYouGive} fallback="Đây là cơ hội để bạn dẫn dắt và chia sẻ thế mạnh." />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <ContactRow icon={<MapPin className="w-4 h-4" />} label={teammate.location || 'Chưa cập nhật vị trí'} />
            <ContactRow icon={<Mail className="w-4 h-4" />} label={teammate.email} />
            <ContactRow icon={<Phone className="w-4 h-4" />} label={teammate.phoneNumber || 'Chưa cập nhật số điện thoại'} />
          </div>

          {teammate.matchReasons && teammate.matchReasons.length > 1 && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Vì sao hai bạn hợp?</p>
              <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                {teammate.matchReasons.slice(0, 4).map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InfoCard: React.FC<{
  title: string;
  items: string[];
  fallback: string;
  highlight?: boolean;
}> = ({ title, items, fallback, highlight }) => (
  <div
    className={`rounded-2xl p-4 border ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}
  >
    <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
      {highlight && <Sparkles className="w-4 h-4 text-emerald-500" />}
      {title}
    </p>
    {items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 shadow-sm"
          >
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">{fallback}</p>
    )}
  </div>
);

const ContactRow: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 shadow-sm">{icon}</div>
    <p className="text-sm text-gray-700 truncate">{label}</p>
  </div>
);

export default TeammateRecommendation;
