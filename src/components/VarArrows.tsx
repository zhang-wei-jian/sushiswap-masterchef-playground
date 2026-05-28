import { useEffect, useRef } from 'react';

interface VarArrowsProps {
  activeLineId: string | null;
}

type AccessType = 'read' | 'write';

interface VarAccess {
  varName: string;
  type: AccessType;
}

const LINE_VAR_MAP: Record<string, VarAccess[]> = {
  // updatePool
  'line-u-3': [
    { varName: 'lastRewardBlock', type: 'read' },
  ],
  'line-u-4': [
    { varName: 'lpSupply', type: 'read' },
  ],
  'line-u-5': [
    { varName: 'lastRewardBlock', type: 'read' },
  ],
  'line-u-6': [
    { varName: 'sushiPerBlock', type: 'read' },
  ],
  'line-u-7': [
    { varName: 'accSushiPerShare', type: 'write' },
    { varName: 'lpSupply', type: 'read' },
  ],
  'line-u-8': [
    { varName: 'lastRewardBlock', type: 'write' },
  ],

  // deposit
  'line-d-5': [
    { varName: 'amount', type: 'read' },
  ],
  'line-d-6': [
    { varName: 'amount', type: 'read' },
    { varName: 'accSushiPerShare', type: 'read' },
    { varName: 'rewardDebt', type: 'read' },
  ],
  'line-d-7': [
    { varName: 'wallet', type: 'write' },
  ],
  'line-d-9': [
    { varName: 'amount', type: 'write' },
    { varName: 'lpSupply', type: 'write' },
  ],
  'line-d-10': [
    { varName: 'amount', type: 'read' },
    { varName: 'accSushiPerShare', type: 'read' },
    { varName: 'rewardDebt', type: 'write' },
  ],

  // withdraw
  'line-w-5': [
    { varName: 'amount', type: 'read' },
    { varName: 'accSushiPerShare', type: 'read' },
    { varName: 'rewardDebt', type: 'read' },
  ],
  'line-w-6': [
    { varName: 'wallet', type: 'write' },
  ],
  'line-w-7': [
    { varName: 'amount', type: 'write' },
    { varName: 'lpSupply', type: 'write' },
  ],
  'line-w-8': [
    { varName: 'amount', type: 'read' },
    { varName: 'accSushiPerShare', type: 'read' },
    { varName: 'rewardDebt', type: 'write' },
  ],
};

export default function VarArrows({ activeLineId }: VarArrowsProps) {
  const linesRef = useRef<LeaderLineInstance[]>([]);

  useEffect(() => {
    // Remove existing lines
    linesRef.current.forEach(line => {
      try { line.remove(); } catch {}
    });
    linesRef.current = [];

    if (!activeLineId) return;

    const accesses = LINE_VAR_MAP[activeLineId];
    if (!accesses || accesses.length === 0) return;

    // Find the active code line element
    const codeLineEl = document.querySelector(`[data-line-id="${activeLineId}"]`);
    if (!codeLineEl) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      accesses.forEach(access => {
        const varEl = document.querySelector(`[data-var="${access.varName}"]`);
        if (!varEl) return;

        const color = access.type === 'read' ? '#22c55e' : '#ef4444';

        try {
          const line = new window.LeaderLine(
            codeLineEl as HTMLElement,
            varEl as HTMLElement,
            {
              color,
              size: 2,
              endPlug: 'arrow',
              startPlug: 'disc',
              startPlugSize: 0.6,
              endPlugSize: 1.2,
              path: 'arc',
              dash: access.type === 'read',
              hide: true,
            }
          );
          line.show('draw', { duration: 200, timing: 'ease-out' });
          linesRef.current.push(line);
        } catch {}
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      linesRef.current.forEach(line => {
        try { line.remove(); } catch {}
      });
      linesRef.current = [];
    };
  }, [activeLineId]);

  return null;
}
