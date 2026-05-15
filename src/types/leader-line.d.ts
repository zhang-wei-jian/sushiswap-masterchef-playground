declare global {
  interface Window {
    LeaderLine: {
      new (
        start: HTMLElement,
        end: HTMLElement,
        options?: {
          color?: string;
          size?: number;
          outline?: boolean;
          endPlug?: string;
          startPlug?: string;
          endPlugSize?: number;
          startPlugSize?: number;
          path?: string;
          dash?: boolean;
          hide?: boolean;
        }
      ): LeaderLineInstance;
      pointAnchor: (element: HTMLElement, options: { x: number; y: number }) => unknown;
      areaAnchor: (element: HTMLElement, options: { x: number; y: number; width: number; height: number }) => unknown;
      mouseHoverAnchor: (element: HTMLElement) => unknown;
      pathLabel: (text: string) => unknown;
    };
  }

  interface LeaderLineInstance {
    remove(): void;
    position(): void;
    show(showEffectName?: string, animOptions?: { duration?: number; timing?: string }): LeaderLineInstance;
    hide(showEffectName?: string, animOptions?: { duration?: number; timing?: string }): LeaderLineInstance;
    color: string;
    size: number;
  }
}

export {};
