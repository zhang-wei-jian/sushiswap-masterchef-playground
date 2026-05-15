import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasterChef } from './hooks/useMasterChef';
import CodeSection from './components/CodeSection';
import ControlPanel from './components/ControlPanel';
import StateCard from './components/StateCard';
import VarArrows from './components/VarArrows';

function TokenFlyAnimation({ active, x, y }: { active: boolean; x: number; y: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 1, scale: 1, x, y }}
          animate={{ opacity: 0, scale: 0.3, x: x + 200, y: y - 100 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed z-50 pointer-events-none"
        >
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-black shadow-lg shadow-yellow-400/30">
            $
          </div>
        </motion.div>
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

  const [tokenFly, setTokenFly] = useState({ active: false, x: 0, y: 0 });
  const prevWalletRef = useRef(0);

  useEffect(() => {
    const newWallet = users[currentUser].wallet;
    if (newWallet > prevWalletRef.current && prevWalletRef.current > 0) {
      setTokenFly({ active: true, x: window.innerWidth / 2 - 12, y: window.innerHeight / 2 });
      setTimeout(() => setTokenFly({ active: false, x: 0, y: 0 }), 900);
    }
    prevWalletRef.current = newWallet;
  }, [users, currentUser]);

  const activeLineId = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex].lineId
    : null;

  const activeStepKey = currentStepIndex >= 0 && steps[currentStepIndex]
    ? steps[currentStepIndex].step
    : null;

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-white overflow-hidden">
      <TokenFlyAnimation {...tokenFly} />
      <VarArrows activeLineId={activeLineId} />

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
          globalState={globalState}
          user={users[currentUser]}
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
