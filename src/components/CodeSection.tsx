import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2 } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-solidity';

Prism.manual = true;

interface CodeSectionProps {
  activeLineId: string | null;
  activeStepKey: string | null;
}

interface CodeLine {
  id: string;
  code: string;
  comment?: string;
}

const updatePoolLines: CodeLine[] = [
  { id: 'line-u-1', code: 'function updatePool(uint256 _pid) public {' },
  { id: 'line-u-2', code: '    PoolInfo storage pool = poolInfo[_pid];' },
  { id: 'line-u-3', code: '    if (block.number <= pool.lastRewardBlock) return;', comment: ' // 无新区块则跳过' },
  { id: 'line-u-4', code: '    uint256 lpSupply = pool.lpToken.balanceOf(address(this));', comment: ' // 查询池子总质押量' },
  { id: 'line-u-5', code: '    uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);', comment: ' // 区块差值' },
  { id: 'line-u-6', code: '    uint256 sushiReward = multiplier.mul(sushiPerBlock).mul(pool.allocPoint).div(totalAllocPoint);', comment: ' // 区块差×每块产出×池权重÷总权重=本池奖励' },
  { id: 'line-u-7', code: '    pool.accSushiPerShare = pool.accSushiPerShare.add(sushiReward.mul(1e12).div(lpSupply));', comment: ' // acc += 奖励×精度÷总质押(每股分红)' },
  { id: 'line-u-8', code: '    pool.lastRewardBlock = block.number;', comment: ' // 记录最新区块' },
  { id: 'line-u-9', code: '}' },
];

const depositLines: CodeLine[] = [
  { id: 'line-d-1', code: 'function deposit(uint256 _pid, uint256 _amount) public {' },
  { id: 'line-d-2', code: '    PoolInfo storage pool = poolInfo[_pid];' },
  { id: 'line-d-3', code: '    UserInfo storage user = userInfo[_pid][msg.sender];' },
  { id: 'line-d-4', code: '    updatePool(_pid);', comment: ' // 1. 同步全局水位' },
  { id: 'line-d-5', code: '    if (user.amount > 0) {' },
  { id: 'line-d-6', code: '        uint256 pending = user.amount.mul(pool.accSushiPerShare).div(1e12).sub(user.rewardDebt);', comment: ' // pending = 份额×acc÷精度 - 旧负债' },
  { id: 'line-d-7', code: '        safeSushiTransfer(msg.sender, pending);', comment: ' // 2. 发放旧账' },
  { id: 'line-d-8', code: '    }' },
  { id: 'line-d-9', code: '    user.amount = user.amount.add(_amount);', comment: ' // 3. 增加用户质押量' },
  { id: 'line-d-10', code: '    user.rewardDebt = user.amount.mul(pool.accSushiPerShare).div(1e12);', comment: ' // 4. 新快照 = 新份额×acc÷精度' },
  { id: 'line-d-11', code: '}' },
];

const withdrawLines: CodeLine[] = [
  { id: 'line-w-1', code: 'function withdraw(uint256 _pid, uint256 _amount) public {' },
  { id: 'line-w-2', code: '    PoolInfo storage pool = poolInfo[_pid];' },
  { id: 'line-w-3', code: '    UserInfo storage user = userInfo[_pid][msg.sender];' },
  { id: 'line-w-4', code: '    updatePool(_pid);', comment: ' // 1. 同步全局水位' },
  { id: 'line-w-5', code: '    uint256 pending = user.amount.mul(pool.accSushiPerShare).div(1e12).sub(user.rewardDebt);', comment: ' // pending = 份额×acc÷精度 - 旧负债' },
  { id: 'line-w-6', code: '    safeSushiTransfer(msg.sender, pending);', comment: ' // 2. 发放旧账' },
  { id: 'line-w-7', code: '    user.amount = user.amount.sub(_amount);', comment: ' // 3. 减少用户质押量' },
  { id: 'line-w-8', code: '    user.rewardDebt = user.amount.mul(pool.accSushiPerShare).div(1e12);', comment: ' // 4. 新快照 = 新份额×acc÷精度' },
  { id: 'line-w-9', code: '}' },
];

function tokenizeLine(code: string): Array<{ text: string; className?: string }> {
  const tokens = Prism.tokenize(code, Prism.languages.solidity);
  const result: Array<{ text: string; className?: string }> = [];

  function processToken(token: string | Prism.Token) {
    if (typeof token === 'string') {
      result.push({ text: token });
    } else {
      result.push({
        text: token.content as string,
        className: `token-${token.type}`,
      });
    }
  }

  tokens.forEach(processToken);
  return result;
}

function HighlightedLine({ line, isActive }: { line: CodeLine; isActive: boolean }) {
  const tokens = useMemo(() => tokenizeLine(line.code), [line.code]);

  return (
    <div
      className={`code-line flex items-center px-3 py-0.5 rounded border-l-3 transition-all duration-200 ${
        isActive
          ? 'bg-red-500/30 border-l-red-500 text-white font-bold'
          : 'border-l-transparent hover:bg-white/5'
      }`}
    >
      <span className="mr-4 select-none text-gray-500 text-xs font-mono w-8 text-right shrink-0">
        {line.id.split('-').slice(-1)}
      </span>
      <span className="font-mono text-[13px] whitespace-pre">
        {tokens.map((token, i) =>
          token.className ? (
            <span key={i} className={token.className}>{token.text}</span>
          ) : (
            <span key={i}>{token.text}</span>
          )
        )}
        {line.comment && (
          <span className="text-green-500">{line.comment}</span>
        )}
      </span>
    </div>
  );
}

export default function CodeSection({ activeLineId, activeStepKey }: CodeSectionProps) {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineId && codeRef.current) {
      const el = codeRef.current.querySelector(`[data-line-id="${activeLineId}"]`);
      if (el) {
        const container = codeRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = el.getBoundingClientRect();
        const elementRelativeTop = elementRect.top - containerRect.top;
        const currentScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const targetScrollTop = currentScrollTop + elementRelativeTop - (containerHeight / 2) + (elementRect.height / 2);
        const maxScrollTop = container.scrollHeight - containerHeight;
        const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
        if (Math.abs(clampedScrollTop - currentScrollTop) > 10) {
          container.scrollTo({ top: clampedScrollTop, behavior: 'smooth' });
        }
      }
    }
  }, [activeLineId]);

  const stepLabel =
    activeStepKey === 'A'
      ? 'Step A: updatePool()'
      : activeStepKey === 'B'
      ? 'Step B: Settlement'
      : activeStepKey === 'C'
      ? 'Step C: Update Balance'
      : activeStepKey === 'D'
      ? 'Step D: Reset Debt'
      : null;

  return (
    <section className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 shrink-0">
        <FileCode2 size={16} className="text-red-500" />
        <span className="text-sm font-medium text-gray-300">Solidity</span>
        <AnimatePresence>
          {stepLabel && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.08 }}
              className="ml-auto text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30"
            >
              {stepLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div ref={codeRef} className="flex-1 overflow-y-auto p-2">
        <pre className="text-[13px] leading-relaxed">
          <div className="mb-4">
            {updatePoolLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <HighlightedLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>
          <div className="mb-4">
            {depositLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <HighlightedLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>
          <div>
            {withdrawLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <HighlightedLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>
        </pre>
      </div>
    </section>
  );
}
