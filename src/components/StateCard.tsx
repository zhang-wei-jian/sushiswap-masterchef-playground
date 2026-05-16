import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, User, ScrollText, Gift, Wallet } from 'lucide-react';
import type { GlobalState, UserState } from '../hooks/useMasterChef';

interface StateCardProps {
  globalState: GlobalState;
  user: UserState;
  currentUser: string;
  onSwitchUser: (user: string) => void;
  pendingSushi: number;
  logs: string[];
  currentStepIndex: number;
}

const PRECISION = 1e12;

function formatAcc(val: number): string {
  return (val / PRECISION).toFixed(4);
}

function formatDebt(val: number): string {
  return (val / PRECISION).toFixed(4);
}

export default function StateCard({ globalState, user, currentUser, onSwitchUser, pendingSushi, logs, currentStepIndex }: StateCardProps) {
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="flex flex-col h-full bg-[#0d0d0d] border-l border-gray-800 overflow-y-auto">
      {/* Header with Account Selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-200">Accounts</h2>
          <select
            value={currentUser}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-1.5 text-xs font-mono text-yellow-400 focus:outline-none focus:border-yellow-500 cursor-pointer"
          >
            <option value="Alice">Alice</option>
            <option value="Bob">Bob</option>
            <option value="Charlie">Charlie</option>
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Wallet size={12} className="text-yellow-500" /> Wallet SUSHI:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={user.wallet.toFixed(2)}
                animate={{ color: '#eab308' }}
                transition={{ duration: 0.3 }}
                className="text-xs font-mono font-bold text-yellow-400"
              >
                {user.wallet.toFixed(2)}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="p-1.5 rounded border-2 border-dashed border-green-500/30 bg-green-500/[0.03] group relative" title="🔍 这是前端通过 view 函数模拟计算出的'幻象利息'。此时链上账本并未真实更新，不消耗 Gas。">
            <div className="flex justify-between text-xs items-center">
              <span className="text-gray-400 flex items-center gap-1"><Gift size={12} className="text-green-500/70" /> pendingSushi:</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={pendingSushi.toFixed(2)}
                  animate={{ opacity: [0.6, 1, 0.6], color: '#4ade80' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xs font-mono font-bold"
                >
                  {pendingSushi.toFixed(2)}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* User State */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-red-500" />
          <h3 className="text-sm font-bold text-gray-200">
            User State: <span className="text-red-500">{currentUser}</span>
          </h3>
        </div>
        <div className="space-y-2">
          <StateRow
            label="Amount (S)"
            value={String(user.amount)}
            highlight={currentStepIndex >= 0}
            varName="amount"
          />
          <StateRow
            label="rewardDebt (D)"
            value={formatDebt(user.rewardDebt)}
            highlight={currentStepIndex >= 0}
            varName="rewardDebt"
            valueColor="text-red-400"
          />
        </div>
      </div>

      {/* Global State */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-blue-400" />
          <h3 className="text-sm font-bold text-gray-200">Global State</h3>
        </div>
        <div className="space-y-2">
          <StateRow
            label="accSushiPerShare"
            value={formatAcc(globalState.accSushiPerShare)}
            highlight={currentStepIndex >= 0}
            varName="accSushiPerShare"
          />
          <StateRow
            label="lastRewardBlock"
            value={String(globalState.lastRewardBlock)}
            highlight={currentStepIndex >= 0}
            varName="lastRewardBlock"
          />
          <StateRow
            label="lpSupply"
            value={String(globalState.lpSupply)}
            highlight={currentStepIndex >= 0}
            varName="lpSupply"
          />
          <StateRow
            label="sushiPerBlock"
            value={String(globalState.sushiPerBlock)}
            varName="sushiPerBlock"
          />
        </div>
      </div>

      {/* Execution Log */}
      <div className="flex-1 flex flex-col px-4 py-3 min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <ScrollText size={16} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-200">Execution Log</h3>
        </div>
        <div
          ref={logBoxRef}
          className="flex-1 overflow-y-auto p-2 rounded bg-black border border-gray-800 text-[11px] font-mono text-gray-400 space-y-0.5"
        >
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? 'text-green-400' : ''}>
              <span className="text-gray-600">&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StateRow({
  label,
  value,
  highlight = false,
  valueColor = 'text-green-400',
  varName,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueColor?: string;
  varName?: string;
}) {
  return (
    <div data-var={varName} className="flex justify-between items-center">
      <span className="text-xs text-gray-400 font-mono">{label}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={highlight ? { color: '#ffffff' } : false}
          animate={{ color: valueColor === 'text-green-400' ? '#00ff88' : valueColor === 'text-yellow-400' ? '#eab308' : valueColor === 'text-red-400' ? '#ef4444' : '#ffffff' }}
          transition={{ duration: 0.3 }}
          className={`text-xs font-mono font-bold ${valueColor}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
