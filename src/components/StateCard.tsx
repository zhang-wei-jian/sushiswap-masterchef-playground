import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, User, ScrollText } from 'lucide-react';
import type { GlobalState, UserState } from '../hooks/useMasterChef';

interface StateCardProps {
  globalState: GlobalState;
  user: UserState;
  currentUser: string;
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

export default function StateCard({ globalState, user, currentUser, logs, currentStepIndex }: StateCardProps) {
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="flex flex-col h-full bg-[#0d0d0d] border-l border-gray-800 overflow-y-auto">
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

      {/* User State */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-red-500" />
          <h3 className="text-sm font-bold text-gray-200">
            User:{' '}
            <span className="text-red-500">{currentUser}</span>
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
          />
          <StateRow
            label="Wallet SUSHI"
            value={user.wallet.toFixed(2)}
            valueColor="text-yellow-400"
            varName="wallet"
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
          animate={{ color: valueColor === 'text-green-400' ? '#00ff88' : valueColor === 'text-yellow-400' ? '#eab308' : '#ffffff' }}
          transition={{ duration: 0.3 }}
          className={`text-xs font-mono font-bold ${valueColor}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
