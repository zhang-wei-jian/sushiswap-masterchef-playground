import { useState, useCallback } from 'react';

const PRECISION = 1e12;
const SUSHI_PER_BLOCK = 100;

export interface UserState {
  name: string;
  amount: number;
  rewardDebt: number;
  wallet: number;
  color: string;
}

export interface GlobalState {
  block: number;
  accSushiPerShare: number;
  lastRewardBlock: number;
  lpSupply: number;
  sushiPerBlock: number;
}

export interface StepInfo {
  id: string;
  message: string;
  codeLine: string;
}

export type OperationType = 'deposit' | 'withdraw';

export type StepKey = 'A' | 'B' | 'C' | 'D';

export interface ExecutionStep {
  step: StepKey;
  lineId: string;
  message: string;
  globalState: GlobalState;
  userState: UserState;
}

const createInitialUsers = (): Record<string, UserState> => ({
  Alice: { name: 'Alice', amount: 0, rewardDebt: 0, wallet: 0, color: '#00ff88' },
  Bob: { name: 'Bob', amount: 0, rewardDebt: 0, wallet: 0, color: '#569cd6' },
  Charlie: { name: 'Charlie', amount: 0, rewardDebt: 0, wallet: 0, color: '#dcdcaa' },
});

export function useMasterChef() {
  const [globalState, setGlobalState] = useState<GlobalState>({
    block: 0,
    accSushiPerShare: 0,
    lastRewardBlock: 0,
    lpSupply: 0,
    sushiPerBlock: SUSHI_PER_BLOCK,
  });

  const [users, setUsers] = useState<Record<string, UserState>>(createInitialUsers());
  const [currentUser, setCurrentUser] = useState('Alice');
  const [userSteps, setUserSteps] = useState<Record<string, ExecutionStep[]>>({});
  const [userStepIndex, setUserStepIndex] = useState<Record<string, number>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>(['等待操作...']);
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, msg]);
  }, []);

  const executeUpdatePool = useCallback((
    currentGlobal: GlobalState,
    targetBlock: number
  ): { newGlobal: GlobalState; accDelta: number } => {
    let newGlobal = { ...currentGlobal };
    const multiplier = targetBlock - newGlobal.lastRewardBlock;

    if (multiplier > 0 && newGlobal.lpSupply > 0) {
      const reward = multiplier * newGlobal.sushiPerBlock;
      const accDelta = (reward * PRECISION) / newGlobal.lpSupply;
      newGlobal.accSushiPerShare += accDelta;
      return { newGlobal, accDelta };
    }

    return { newGlobal, accDelta: 0 };
  }, []);

  const calculateTempAcc = useCallback((state: GlobalState, targetBlock: number) => {
    let tempAcc = state.accSushiPerShare;
    if (targetBlock > state.lastRewardBlock && state.lpSupply > 0) {
      const multiplier = targetBlock - state.lastRewardBlock;
      const reward = multiplier * state.sushiPerBlock;
      tempAcc += (reward * PRECISION) / state.lpSupply;
    }
    return tempAcc;
  }, []);

  const getPendingSushi = useCallback((userName: string, targetBlock?: number) => {
    const block = targetBlock ?? globalState.block;
    const user = users[userName];
    if (!user) return 0;
    const tempAcc = calculateTempAcc(globalState, block);
    const pending = (user.amount * tempAcc) / PRECISION - user.rewardDebt / PRECISION;
    return Math.max(0, pending);
  }, [globalState, users, calculateTempAcc]);

  const nextBlock = useCallback(() => {
    if (isExecuting) return;
    setGlobalState(prev => ({ ...prev, block: prev.block + 1 }));
    addLog(`区块增加到 ${globalState.block + 1}`);
  }, [isExecuting, globalState.block, addLog]);

  const runTransaction = useCallback(async (type: OperationType, amount: number) => {
    if (isExecuting) return;
    setIsExecuting(true);
    setUserSteps(prev => ({ ...prev, [currentUser]: [] }));

    const user = users[currentUser];
    if (type === 'withdraw' && user.amount <= 0) {
      addLog(`错误: 未质押过，无法提取!`);
      setIsExecuting(false);
      return;
    }

    const newSteps: ExecutionStep[] = [];
    let currentGlobal = { ...globalState };
    let currentUserState = { ...user };
    const targetBlock = currentGlobal.block;

    const pushStep = (step: StepKey, lineId: string, message: string) => {
      newSteps.push({
        step,
        lineId,
        message,
        globalState: { ...currentGlobal },
        userState: { ...currentUserState },
      });
    };

    const prefix = type === 'deposit' ? 'd' : 'w';

    // Entry line
    pushStep('A', `line-${prefix}-1`, `执行 ${type}(${amount})...`);

    // Step A: updatePool
    pushStep('A', `line-${prefix}-4`, `调用 updatePool()`);
    pushStep('A', 'line-u-1', `进入 updatePool`);

    const { newGlobal, accDelta } = executeUpdatePool(currentGlobal, targetBlock);
    currentGlobal = newGlobal;

    if (accDelta > 0) {
      pushStep('A', 'line-u-7', `累加新水位: acc += ${accDelta / PRECISION}`);
    } else {
      pushStep('A', 'line-u-7', `无新区块奖励或无质押者`);
    }

    currentGlobal.lastRewardBlock = targetBlock;
    pushStep('A', 'line-u-8', `更新最后区块: last = ${targetBlock}`);

    // Step B: Settlement
    pushStep('B', `line-${prefix}-5`, `检查旧账...`);
    const pending = (currentUserState.amount * currentGlobal.accSushiPerShare) / PRECISION - currentUserState.rewardDebt / PRECISION;

    if (pending > 0) {
      pushStep('B', `line-${prefix}-6`, `计算奖金: (${currentUserState.amount} × ${currentGlobal.accSushiPerShare / PRECISION}) - ${currentUserState.rewardDebt / PRECISION} = ${pending.toFixed(2)}`);
      currentUserState.wallet += pending;
      pushStep('B', `line-${prefix}-7`, `发送奖金给用户钱包: +${pending.toFixed(2)} SUSHI`);
    } else {
      pushStep('B', `line-${prefix}-5`, `无待领取奖励 (pending = 0)`);
    }

    // Step C: Update Balance
    if (type === 'deposit') {
      currentUserState.amount += amount;
      currentGlobal.lpSupply += amount;
      pushStep('C', 'line-d-9', `增加本金: amount = ${currentUserState.amount}, lpSupply = ${currentGlobal.lpSupply}`);
    } else {
      if (currentUserState.amount < amount) {
        addLog(`错误: 余额不足! amount=${currentUserState.amount}, withdraw=${amount}`);
        setTimeout(() => setIsExecuting(false), 0);
        setUserSteps(prev => ({ ...prev, [currentUser]: newSteps }));
        return;
      }
      currentUserState.amount -= amount;
      currentGlobal.lpSupply -= amount;
      pushStep('C', 'line-w-7', `减少本金: amount = ${currentUserState.amount}, lpSupply = ${currentGlobal.lpSupply}`);
    }

    // Step D: Reset Debt
    const newDebt = (currentUserState.amount * currentGlobal.accSushiPerShare);
    currentUserState.rewardDebt = newDebt;
    const stepDLine = type === 'deposit' ? 'line-d-10' : 'line-w-8';
    pushStep('D', stepDLine, `重置负债: rewardDebt = ${currentUserState.amount} × ${currentGlobal.accSushiPerShare / PRECISION} = ${newDebt / PRECISION}`);

    // Update state
    setGlobalState(currentGlobal);
    setUsers(prev => ({
      ...prev,
      [currentUser]: currentUserState,
    }));
    setUserSteps(prev => ({ ...prev, [currentUser]: newSteps }));
    setUserStepIndex(prev => ({ ...prev, [currentUser]: 0 }));

    addLog(`${type}(${amount}) 执行完毕。`);
    setTimeout(() => setIsExecuting(false), 0);
  }, [isExecuting, globalState, users, currentUser, executeUpdatePool, addLog]);

  const reset = useCallback(() => {
    if (isExecuting) return;
    setGlobalState({
      block: 0,
      accSushiPerShare: 0,
      lastRewardBlock: 0,
      lpSupply: 0,
      sushiPerBlock: SUSHI_PER_BLOCK,
    });
    setUsers(createInitialUsers());
    setUserSteps({});
    setUserStepIndex({});
    setLogs(['等待操作...']);
  }, [isExecuting]);

  const clearSteps = useCallback(() => {
    setUserSteps(prev => ({ ...prev, [currentUser]: [] }));
    setUserStepIndex(prev => ({ ...prev, [currentUser]: -1 }));
  }, [currentUser]);

  const setCurrentUserStepIndex = useCallback((idx: number) => {
    setUserStepIndex(prev => ({ ...prev, [currentUser]: idx }));
  }, [currentUser]);

  return {
    globalState,
    users,
    currentUser,
    setCurrentUser,
    userSteps,
    currentStepIndex: (userStepIndex[currentUser] ?? -1),
    setCurrentUserStepIndex,
    isExecuting,
    logs,
    nextBlock,
    runTransaction,
    reset,
    clearSteps,
    getPendingSushi,
    calculateTempAcc,
  };
}
