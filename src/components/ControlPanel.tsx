import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Play,
  Pause,
  Coins,
} from 'lucide-react';
import type { GlobalState, UserState, OperationType } from '../hooks/useMasterChef';

interface ControlPanelProps {
  globalState: GlobalState;
  users: Record<string, UserState>;
  currentUser: string;
  isExecuting: boolean;
  steps: Array<{ step: string; message: string }>;
  currentStepIndex: number;
  onSwitchUser: (name: string) => void;
  onRunTransaction: (type: OperationType, amount: number) => void;
  onNextBlock: () => void;
  onReset: () => void;
  onSetCurrentStepIndex: (idx: number) => void;
  onClearSteps: () => void;
  getPendingSushi: (userName: string) => number;
}

const WALLET_COLORS: Record<string, string> = {
  Alice: '#00ff88',
  Bob: '#569cd6',
  Charlie: '#dcdcaa',
};

export default function ControlPanel({
  globalState,
  users,
  currentUser,
  isExecuting,
  steps,
  currentStepIndex,
  onSwitchUser,
  onRunTransaction,
  onNextBlock,
  onReset,
  onSetCurrentStepIndex,
  onClearSteps,
  getPendingSushi,
}: ControlPanelProps) {
  const [amount, setAmount] = useState(100);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(300);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIsExecutingRef = useRef(false);
  const user = users[currentUser];
  const pending = getPendingSushi(currentUser);

  const stopAutoPlay = useCallback(() => {
    setAutoPlay(false);
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (steps.length === 0) return;
    setAutoPlay(true);
    let idx = currentStepIndex >= steps.length - 1 ? 0 : currentStepIndex;
    onSetCurrentStepIndex(idx);
    const tick = () => {
      idx++;
      if (idx >= steps.length) {
        setAutoPlay(false);
        autoPlayRef.current = null;
        return;
      }
      onSetCurrentStepIndex(idx);
      autoPlayRef.current = setTimeout(tick, autoSpeed);
    };
    autoPlayRef.current = setTimeout(tick, autoSpeed);
  }, [steps, currentStepIndex, autoSpeed, onSetCurrentStepIndex]);

  const stepsRef = useRef(steps);
  const autoSpeedRef = useRef(autoSpeed);
  stepsRef.current = steps;
  autoSpeedRef.current = autoSpeed;

  useEffect(() => {
    if (prevIsExecutingRef.current && !isExecuting) {
      prevIsExecutingRef.current = isExecuting;
      const currentSteps = stepsRef.current;
      if (currentSteps.length > 0 && !autoPlayRef.current) {
        onSetCurrentStepIndex(0);
        setAutoPlay(true);
        let idx = 0;
        const tick = () => {
          idx++;
          if (idx >= currentSteps.length) {
            setAutoPlay(false);
            autoPlayRef.current = null;
            return;
          }
          onSetCurrentStepIndex(idx);
          autoPlayRef.current = setTimeout(tick, autoSpeedRef.current);
        };
        autoPlayRef.current = setTimeout(tick, autoSpeedRef.current);
      }
    } else {
      prevIsExecutingRef.current = isExecuting;
    }
  }, [isExecuting, onSetCurrentStepIndex]);

  const handleManualStep = (direction: 'next' | 'prev') => {
    stopAutoPlay();
    if (direction === 'next' && currentStepIndex < steps.length - 1) {
      onSetCurrentStepIndex(currentStepIndex + 1);
    } else if (direction === 'prev' && currentStepIndex > 0) {
      onSetCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <section className="flex flex-col h-full bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={18} className="text-red-500" />
          <span className="text-sm font-bold text-red-500">MasterChef Debugger</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Block: <span className="text-green-400 font-mono font-bold">{globalState.block}</span>
          </span>
          <button
            onClick={onNextBlock}
            disabled={isExecuting}
            className="text-xs px-3 py-1 rounded border border-green-500/50 text-green-400 hover:bg-green-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Next Block
          </button>
        </div>
      </div>

      {/* Account Selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-400 mb-2">Accounts</p>
        <div className="flex gap-2">
          {Object.keys(users).map((name) => (
            <button
              key={name}
              onClick={() => { if (!isExecuting) { stopAutoPlay(); onSwitchUser(name); onClearSteps(); } }}
              disabled={isExecuting}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                currentUser === name
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              style={currentUser === name ? { borderColor: WALLET_COLORS[name], color: WALLET_COLORS[name] } : {}}
            >
              {name}
            </button>
          ))}
        </div>

        {/* User stats */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">LP Balance:</span>
            <span className="text-white font-mono">{user.amount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Reward:</span>
            <span className="text-red-500 font-mono">{pending.toFixed(2)} SUSHI</span>
          </div>
        </div>
      </div>

      {/* Input & Actions */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="relative mb-2">
          <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0}
            className="w-full pl-9 pr-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm font-mono focus:border-red-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onRunTransaction('deposit', amount); }}
            disabled={isExecuting || amount <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownToLine size={14} />
            Deposit
          </button>
          <button
            onClick={() => { onRunTransaction('withdraw', amount); }}
            disabled={isExecuting || amount <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gray-700 text-white text-sm font-bold hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpFromLine size={14} />
            Withdraw
          </button>
        </div>
      </div>

      {/* Step Controls */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">
            断点调试 {steps.length > 0 && `${currentStepIndex + 1}/${steps.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleManualStep('prev')}
              disabled={currentStepIndex <= 0}
              className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &lt;
            </button>
            <button
              onClick={() => handleManualStep('next')}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={autoPlay ? stopAutoPlay : startAutoPlay}
            disabled={steps.length === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              autoPlay
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {autoPlay ? <Pause size={12} /> : <Play size={12} />}
            {autoPlay ? 'Stop' : 'Auto Play'}
          </button>
          <select
            value={autoSpeed}
            onChange={(e) => setAutoSpeed(Number(e.target.value))}
            className="px-2 py-1.5 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none"
          >
            <option value={1200}>慢 (1.2s)</option>
            <option value={700}>中 (0.7s)</option>
            <option value={300}>快 (0.3s)</option>
          </select>
        </div>
      </div>

      {/* Current Step Message */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-400 mb-1">当前步骤</p>
        <AnimatePresence mode="wait">
          {steps[currentStepIndex] ? (
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.08 }}
              className="p-2 rounded bg-gray-900 border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  steps[currentStepIndex].step === 'A' ? 'bg-blue-500/20 text-blue-400' :
                  steps[currentStepIndex].step === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                  steps[currentStepIndex].step === 'C' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {steps[currentStepIndex].step}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-mono leading-relaxed">
                {steps[currentStepIndex].message}
              </p>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.08 }}
              className="text-xs text-gray-500 italic"
            >
              执行 deposit/withdraw 后查看步骤
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Reset */}
      <div className="px-4 py-3 border-b border-gray-800">
        <button
          onClick={() => { stopAutoPlay(); onReset(); }}
          disabled={isExecuting}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 text-xs hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={12} />
          重置所有状态
        </button>
      </div>

      {/* Step History */}
      <div className="px-4 py-3 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-xs text-gray-400">执行步骤记录</p>
          {steps.length > 0 && (
            <button
              onClick={onClearSteps}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
            >
              清空
            </button>
          )}
        </div>
        {steps.length === 0 ? (
          <p className="text-xs text-gray-500 italic shrink-0">暂无步骤记录</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {steps.map((s, i) => (
              <div
                key={i}
                onClick={() => onSetCurrentStepIndex(i)}
                className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors ${
                  i === currentStepIndex
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'hover:bg-gray-800 border border-transparent'
                }`}
              >
                <span className={`shrink-0 px-1 py-0.5 rounded text-[9px] font-bold ${
                  s.step === 'A' ? 'bg-blue-500/20 text-blue-400' :
                  s.step === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                  s.step === 'C' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {s.step}
                </span>
                <span className="text-gray-300 font-mono leading-snug break-all">
                  {s.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
