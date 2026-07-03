import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Lightbulb, TrendingUp, TrendingDown, RefreshCw, BarChart2, Activity, ShieldAlert, Award } from 'lucide-react';

export const AIInsightsPanel: React.FC = () => {
  const { aiInsights } = useSocket();
  const { t } = useLanguage();

  // Loading skeleton state
  if (!aiInsights) {
    return (
      <div className="p-6 glass-panel rounded-3xl mb-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-800 rounded-2xl col-span-2"></div>
          <div className="h-32 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const {
    summary,
    efficiencyScore,
    efficiencyGrade,
    efficiencyColor,
    recommendations,
    anomalies,
    cards,
    trendAnalysis
  } = aiInsights;

  // Efficiency score color logic for progress visualization
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'stroke-emerald-500';
    if (score >= 75) return 'stroke-sky-500';
    if (score >= 60) return 'stroke-yellow-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="p-6 glass-panel rounded-3xl mb-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400 animate-pulse" />
            {t('insights.title')}
          </h2>
          <p className="text-xs text-slate-400">{t('insights.subtitle')}</p>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20 font-bold uppercase tracking-wider animate-pulse">
          <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} /> Live Analytics
        </span>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* AI Summary Card */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <Sparkles size={100} className="text-indigo-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                <Sparkles size={14} className="animate-pulse" />
              </span>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{t('insights.summary')}</span>
            </div>
            <p className="text-sm font-semibold text-slate-100 leading-relaxed italic">
              "{summary}"
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/40 text-[10px] text-slate-500 font-medium">
            Generated dynamically from real-time telemetry events.
          </div>
        </div>

        {/* Efficiency Score Animated Radial Gauge */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-2">
            
            {/* SVG Progress Circle */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="6"
                stroke="#1e293b"
                fill="transparent"
                className="stroke-slate-800"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * efficiencyScore) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${getScoreColor(efficiencyScore)}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white leading-none">{efficiencyScore}</span>
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider mt-0.5">Score</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Efficiency Rating</div>
            <div className={`text-xs font-bold px-2.5 py-0.5 mt-1 rounded border inline-block ${efficiencyColor}`}>
              {efficiencyGrade}
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic 5 Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Office Health */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Activity size={16} />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Office Health</div>
            <div className="text-xs font-bold text-white mt-0.5">{cards.officeHealth}</div>
          </div>
        </div>

        {/* Card 2: Most Active Room */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
            <BarChart2 size={16} />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Most Active Room</div>
            <div className="text-xs font-bold text-white mt-0.5">{cards.mostActiveRoom}</div>
          </div>
        </div>

        {/* Card 3: Highest Power Device */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Lightbulb size={16} />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Highest Device</div>
            <div className="text-xs font-bold text-white mt-0.5 truncate max-w-[100px]" title={cards.highestPowerDevice}>
              {cards.highestPowerDevice}
            </div>
          </div>
        </div>

        {/* Card 4: Estimated Daily Cost */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <span className="text-xs font-black font-sans">{t('common.currency')}</span>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Daily Cost (Est)</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {t('common.currency')}{cards.estimatedDailyCost.toFixed(2)}
            </div>
          </div>
        </div>

      </div>

      {/* Grid Split: Smart Recommendations & Anomalies + Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendations Column */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Suggestions</h3>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec) => {
              const priorityStyles = {
                HIGH: 'bg-rose-500/5 border-rose-500/20 text-rose-300',
                MEDIUM: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
                LOW: 'bg-slate-900/50 border-slate-800 text-slate-300'
              };
              
              const priorityBadge = {
                HIGH: 'bg-rose-600/20 text-rose-400 border-rose-500/30',
                MEDIUM: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
                LOW: 'bg-slate-800 text-slate-400 border-slate-700'
              };

              return (
                <div key={rec.id} className={`p-4 rounded-xl border flex flex-col gap-1 transition-all duration-300 hover:scale-[1.01] ${priorityStyles[rec.priority]}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold">{rec.title}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${priorityBadge[rec.priority]}`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1">{rec.reason}</p>
                  <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-emerald-400 uppercase">
                    <Award size={10} /> Est. Savings: {rec.savings}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anomaly Detection & Power Trend Column */}
        <div className="flex flex-col gap-6">
          
          {/* Anomalies List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Anomaly Detection</h3>
            {anomalies.length > 0 ? (
              <div className="flex flex-col gap-3">
                {anomalies.map((anom) => (
                  <div key={anom.id} className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/25 flex gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse" />
                    <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <div className="text-xs font-bold text-rose-300">{anom.type}</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{anom.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-800 text-center flex flex-col items-center justify-center">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-full mb-1">
                  <Activity size={14} />
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No Anomalies Found</span>
              </div>
            )}
          </div>

          {/* Trend Analysis Details */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Power Trend Analysis</h3>
            <div className="flex flex-col gap-2 text-[11px] text-slate-400">
              
              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span>Load Trend</span>
                <span className={`font-bold flex items-center gap-1 ${
                  trendAnalysis.status === 'INCREASING' ? 'text-rose-400' :
                  trendAnalysis.status === 'DECREASING' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {trendAnalysis.status === 'INCREASING' ? <TrendingUp size={12} /> :
                   trendAnalysis.status === 'DECREASING' ? <TrendingDown size={12} /> : null}
                  {trendAnalysis.status}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span>Peak Load Hour</span>
                <span className="font-bold text-white">{trendAnalysis.peakUsageTime}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                <span>Average Hourly Load</span>
                <span className="font-bold text-white">{trendAnalysis.averageHourlyUsage.toFixed(0)} W</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span>Highest Room</span>
                <span className="font-bold text-indigo-400">{trendAnalysis.highestConsumingRoom}</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
