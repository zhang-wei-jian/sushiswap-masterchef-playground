import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterChef } from './hooks/useMasterChef';
import CodeSection from './components/CodeSection';
import ControlPanel from './components/ControlPanel';
import StateCard from './components/StateCard';
import VarArrows from './components/VarArrows';

const TRANSFER_LINES = ['line-d-6', 'line-w-6'];

function CoinParticle({ delay, offsetX, offsetY, scale }: { delay: number; offsetX: number; offsetY: number; scale: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale }}
      animate={{ opacity: 0, x: offsetX, y: offsetY, scale: scale * 0.2 }}
      transition={{ duration: 1 + Math.random() * 0.5, delay, ease: 'easeOut' }}
      className="absolute pointer-events-none"
    >
      <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[9px] font-bold text-black shadow-lg shadow-yellow-400/40">
        $
      </div>
    </motion.div>
  );
}

function CoinExplosion({ active }: { active: boolean }) {
  const coins = [
    { delay: 0, ox: -120, oy: -80, s: 1 },
    { delay: 0.05, ox: 100, oy: -100, s: 0.9 },
    { delay: 0.08, ox: -60, oy: -120, s: 0.8 },
    { delay: 0.03, ox: 140, oy: -70, s: 1.1 },
    { delay: 0.1, ox: 0, oy: -130, s: 0.7 },
    { delay: 0.06, ox: -150, oy: -40, s: 0.85 },
    { delay: 0.12, ox: 80, oy: -110, s: 0.95 },
    { delay: 0.07, ox: -30, oy: -90, s: 1.05 },
  ];

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed z-50 pointer-events-none" style={{ left: '50%', top: '50%' }}>
          {coins.map((c, i) => (
            <CoinParticle key={i} delay={c.delay} offsetX={c.ox} offsetY={c.oy} scale={c.s} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const {
    globalState,
    users,
    currentUser,
    setCurrentUser,
    userSteps,
    currentStepIndex,
    setCurrentUserStepIndex,
    isExecuting,
    logs,
    nextBlock,
    runTransaction,
    reset,
    clearSteps,
    getPendingSushi,
  } = useMasterChef();

  const steps = userSteps[currentUser] || [];

  const activeLineId = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex].lineId
    : null;

  const currentStep = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex]
    : null;

  const isTransferStep = activeLineId !== null && TRANSFER_LINES.includes(activeLineId);
  const [coinActive, setCoinActive] = useState(false);
  const prevTransferRef = useRef(false);

  useEffect(() => {
    if (isTransferStep && !prevTransferRef.current) {
      setCoinActive(true);
      setTimeout(() => setCoinActive(false), 1500);
    }
    prevTransferRef.current = isTransferStep;
  }, [isTransferStep]);

  const activeStepKey = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex].step
    : null;

  const displayGlobalState = currentStep ? currentStep.globalState : globalState;
  const displayUserState = currentStep ? currentStep.userState : users[currentUser];

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-white overflow-hidden">
      <CoinExplosion active={coinActive} />
      <VarArrows activeLineId={activeLineId} />

      {/* GitHub Logo */}
      <a
        href="https://github.com/zhang-wei-jian/SushiSwap-MasterChef-Playground"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 text-gray-600 hover:text-white transition-colors duration-200"
      >
        <svg height="32" width="32" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>

      {/* 3-column grid layout */}
      <div className="flex-1 grid grid-cols-[350px_1fr_320px] gap-px bg-gray-800 overflow-hidden">
        {/* Left: Control Panel */}
        <ControlPanel
          globalState={globalState}
          users={users}
          currentUser={currentUser}
          isExecuting={isExecuting}
          steps={steps}
          currentStepIndex={currentStepIndex}
          onSwitchUser={setCurrentUser}
          onRunTransaction={runTransaction}
          onHarvest={() => runTransaction('deposit', 0)}
          onNextBlock={nextBlock}
          onReset={reset}
          onSetCurrentStepIndex={setCurrentUserStepIndex}
          onClearSteps={clearSteps}
        />

        {/* Center: Code Viewer */}
        <CodeSection
          activeLineId={activeLineId}
          activeStepKey={activeStepKey}
        />

        {/* Right: State Boards */}
        <StateCard
          globalState={displayGlobalState}
          user={displayUserState}
          currentUser={currentUser}
          onSwitchUser={setCurrentUser}
          pendingSushi={getPendingSushi(currentUser)}
          logs={logs}
          currentStepIndex={currentStepIndex}
        />
      </div>
    </div>
  );
}
