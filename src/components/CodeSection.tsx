import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2 } from 'lucide-react';

interface CodeSectionProps {
  activeLineId: string | null;
  activeStepKey: string | null;
}

interface LineDef {
  id: string;
  indent: number;
  tokens: Array<{ text: string; type?: 'keyword' | 'func' | 'comment' | 'plain' }>;
}

const depositLines: LineDef[] = [
  {
    id: 'line-d-1', indent: 0,
    tokens: [
      { text: 'function ', type: 'keyword' },
      { text: 'deposit', type: 'func' },
      { text: '(uint256 _pid, uint256 _amount) ', type: 'plain' },
      { text: 'public', type: 'keyword' },
      { text: ' {', type: 'plain' },
    ],
  },
  {
    id: 'line-d-2', indent: 1,
    tokens: [
      { text: 'PoolInfo ', type: 'plain' },
      { text: 'storage ', type: 'keyword' },
      { text: 'pool = poolInfo[_pid];', type: 'plain' },
    ],
  },
  {
    id: 'line-d-3', indent: 1,
    tokens: [
      { text: 'UserInfo ', type: 'plain' },
      { text: 'storage ', type: 'keyword' },
      { text: 'user = userInfo[_pid][msg.sender];', type: 'plain' },
    ],
  },
  {
    id: 'line-d-4', indent: 1,
    tokens: [
      { text: 'updatePool', type: 'func' },
      { text: '(_pid); ', type: 'plain' },
      { text: '// 1. 同步全局水位', type: 'comment' },
    ],
  },
  {
    id: 'line-d-5', indent: 1,
    tokens: [
      { text: 'if ', type: 'keyword' },
      { text: '(user.amount > 0) {', type: 'plain' },
    ],
  },
  {
    id: 'line-d-6', indent: 2,
    tokens: [
      { text: 'uint256 pending = user.amount.mul(pool.accSushiPerShare).div(1e12).sub(user.rewardDebt);', type: 'plain' },
    ],
  },
  {
    id: 'line-d-7', indent: 2,
    tokens: [
      { text: 'safeSushiTransfer', type: 'func' },
      { text: '(msg.sender, pending); ', type: 'plain' },
      { text: '// 2. 发放旧账', type: 'comment' },
    ],
  },
  { id: 'line-d-8', indent: 1, tokens: [{ text: '}', type: 'plain' }] },
  {
    id: 'line-d-9', indent: 1,
    tokens: [
      { text: 'user.amount = user.amount.add(_amount); ', type: 'plain' },
      { text: '// 3. 更新个人股份', type: 'comment' },
    ],
  },
  {
    id: 'line-d-10', indent: 1,
    tokens: [
      { text: 'user.rewardDebt = user.amount.mul(pool.accSushiPerShare).div(1e12); ', type: 'plain' },
      { text: '// 4. 重新立快照', type: 'comment' },
    ],
  },
  { id: 'line-d-11', indent: 0, tokens: [{ text: '}', type: 'plain' }] },
];

const withdrawLines: LineDef[] = [
  {
    id: 'line-w-1', indent: 0,
    tokens: [
      { text: 'function ', type: 'keyword' },
      { text: 'withdraw', type: 'func' },
      { text: '(uint256 _pid, uint256 _amount) ', type: 'plain' },
      { text: 'public', type: 'keyword' },
      { text: ' {', type: 'plain' },
    ],
  },
  {
    id: 'line-w-2', indent: 1,
    tokens: [
      { text: 'PoolInfo ', type: 'plain' },
      { text: 'storage ', type: 'keyword' },
      { text: 'pool = poolInfo[_pid];', type: 'plain' },
    ],
  },
  {
    id: 'line-w-3', indent: 1,
    tokens: [
      { text: 'UserInfo ', type: 'plain' },
      { text: 'storage ', type: 'keyword' },
      { text: 'user = userInfo[_pid][msg.sender];', type: 'plain' },
    ],
  },
  {
    id: 'line-w-4', indent: 1,
    tokens: [
      { text: 'updatePool', type: 'func' },
      { text: '(_pid); ', type: 'plain' },
      { text: '// 1. 同步全局水位', type: 'comment' },
    ],
  },
  {
    id: 'line-w-5', indent: 1,
    tokens: [
      { text: 'uint256 pending = user.amount.mul(pool.accSushiPerShare).div(1e12).sub(user.rewardDebt);', type: 'plain' },
    ],
  },
  {
    id: 'line-w-6', indent: 1,
    tokens: [
      { text: 'safeSushiTransfer', type: 'func' },
      { text: '(msg.sender, pending); ', type: 'plain' },
      { text: '// 2. 发放旧账', type: 'comment' },
    ],
  },
  {
    id: 'line-w-7', indent: 1,
    tokens: [
      { text: 'user.amount = user.amount.sub(_amount); ', type: 'plain' },
      { text: '// 3. 减少个人股份', type: 'comment' },
    ],
  },
  {
    id: 'line-w-8', indent: 1,
    tokens: [
      { text: 'user.rewardDebt = user.amount.mul(pool.accSushiPerShare).div(1e12); ', type: 'plain' },
      { text: '// 4. 重新立快照', type: 'comment' },
    ],
  },
  { id: 'line-w-9', indent: 0, tokens: [{ text: '}', type: 'plain' }] },
];

const updatePoolLines: LineDef[] = [
  {
    id: 'line-u-1', indent: 0,
    tokens: [
      { text: 'function ', type: 'keyword' },
      { text: 'updatePool', type: 'func' },
      { text: '(uint256 _pid) ', type: 'plain' },
      { text: 'public', type: 'keyword' },
      { text: ' {', type: 'plain' },
    ],
  },
  {
    id: 'line-u-2', indent: 1,
    tokens: [
      { text: 'PoolInfo ', type: 'plain' },
      { text: 'storage ', type: 'keyword' },
      { text: 'pool = poolInfo[_pid];', type: 'plain' },
    ],
  },
  {
    id: 'line-u-3', indent: 1,
    tokens: [
      { text: 'if ', type: 'keyword' },
      { text: '(block.number <= pool.lastRewardBlock) ', type: 'plain' },
      { text: 'return;', type: 'keyword' },
    ],
  },
  {
    id: 'line-u-4', indent: 1,
    tokens: [
      { text: 'uint256 lpSupply = pool.lpToken.balanceOf(address(this));', type: 'plain' },
    ],
  },
  {
    id: 'line-u-5', indent: 1,
    tokens: [
      { text: 'uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);', type: 'plain' },
    ],
  },
  {
    id: 'line-u-6', indent: 1,
    tokens: [
      { text: 'uint256 sushiReward = multiplier.mul(sushiPerBlock).mul(pool.allocPoint).div(totalAllocPoint);', type: 'plain' },
    ],
  },
  {
    id: 'line-u-7', indent: 1,
    tokens: [
      { text: 'pool.accSushiPerShare = pool.accSushiPerShare.add(sushiReward.mul(1e12).div(lpSupply));', type: 'plain' },
      { text: ' // 累加每股分红', type: 'comment' },
    ],
  },
  {
    id: 'line-u-8', indent: 1,
    tokens: [
      { text: 'pool.lastRewardBlock = block.number;', type: 'plain' },
    ],
  },
  { id: 'line-u-9', indent: 0, tokens: [{ text: '}', type: 'plain' }] },
];

function CodeLine({ line, isActive }: { line: LineDef; isActive: boolean }) {
  const indent = '    '.repeat(line.indent);
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
        {indent}
        {line.tokens.map((token, i) => {
          switch (token.type) {
            case 'keyword':
              return <span key={i} className="text-blue-400">{token.text}</span>;
            case 'func':
              return <span key={i} className="text-yellow-300">{token.text}</span>;
            case 'comment':
              return <span key={i} className="text-green-500">{token.text}</span>;
            default:
              return <span key={i}>{token.text}</span>;
          }
        })}
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
        
        // Calculate the element's position relative to the container
        const elementRelativeTop = elementRect.top - containerRect.top;

        
        // Calculate current scroll position and container dimensions
        const currentScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // Calculate the desired scroll position to center the element
        const targetScrollTop = currentScrollTop + elementRelativeTop - (containerHeight / 2) + (elementRect.height / 2);
        
        // Ensure we don't scroll beyond bounds
        const maxScrollTop = container.scrollHeight - containerHeight;
        const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
        
        // Only scroll if there's a meaningful difference
        if (Math.abs(clampedScrollTop - currentScrollTop) > 10) {
          container.scrollTo({
            top: clampedScrollTop,
            behavior: 'smooth'
          });
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
          {/* updatePool function */}
          <div className="mb-4">
            {updatePoolLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <CodeLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>

          {/* deposit function */}
          <div className="mb-4">
            {depositLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <CodeLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>

          {/* withdraw function */}
          <div>
            {withdrawLines.map((line) => (
              <div key={line.id} data-line-id={line.id}>
                <CodeLine line={line} isActive={activeLineId === line.id} />
              </div>
            ))}
          </div>
        </pre>
      </div>
    </section>
  );
}
