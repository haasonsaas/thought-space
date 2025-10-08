'use client';

import { useEffect, useRef, useState } from 'react';

interface Token {
  id: string;
  text: string;
  x: number;
  y: number;
  probability: number;
  alternatives: { text: string; prob: number }[];
  layer: number;
  chosen: boolean;
  fadeIn: number;
}

interface ThoughtBranch {
  id: string;
  fromToken: string;
  toToken: string;
  strength: number;
  active: boolean;
}

export default function ThoughtSpace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [branches, setBranches] = useState<ThoughtBranch[]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [generationSpeed, setGenerationSpeed] = useState(1000);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Sample tokens representing a thought process
  const thoughtSequence = [
    {
      text: 'I',
      alternatives: [
        { text: 'We', prob: 0.15 },
        { text: 'Let', prob: 0.12 },
        { text: 'To', prob: 0.08 },
      ],
    },
    {
      text: 'think',
      alternatives: [
        { text: 'believe', prob: 0.25 },
        { text: 'wonder', prob: 0.18 },
        { text: 'suppose', prob: 0.12 },
      ],
    },
    {
      text: 'the',
      alternatives: [
        { text: 'this', prob: 0.22 },
        { text: 'that', prob: 0.19 },
        { text: 'a', prob: 0.15 },
      ],
    },
    {
      text: 'answer',
      alternatives: [
        { text: 'solution', prob: 0.31 },
        { text: 'approach', prob: 0.24 },
        { text: 'method', prob: 0.18 },
      ],
    },
    {
      text: 'lies',
      alternatives: [
        { text: 'emerges', prob: 0.28 },
        { text: 'exists', prob: 0.21 },
        { text: 'appears', prob: 0.16 },
      ],
    },
    {
      text: 'in',
      alternatives: [
        { text: 'within', prob: 0.19 },
        { text: 'through', prob: 0.17 },
        { text: 'across', prob: 0.13 },
      ],
    },
    {
      text: 'parallel',
      alternatives: [
        { text: 'distributed', prob: 0.27 },
        { text: 'concurrent', prob: 0.22 },
        { text: 'simultaneous', prob: 0.18 },
      ],
    },
    {
      text: 'possibilities',
      alternatives: [
        { text: 'pathways', prob: 0.29 },
        { text: 'branches', prob: 0.24 },
        { text: 'dimensions', prob: 0.20 },
      ],
    },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerY = canvas.height / 2;
    const spacing = canvas.width / (thoughtSequence.length + 1);

    // Generate token positions
    const newTokens: Token[] = [];
    const newBranches: ThoughtBranch[] = [];

    thoughtSequence.forEach((tokenData, i) => {
      const x = spacing * (i + 1);
      const mainProb = 1 - tokenData.alternatives.reduce((sum, alt) => sum + alt.prob, 0);

      const mainToken: Token = {
        id: `main-${i}`,
        text: tokenData.text,
        x,
        y: centerY,
        probability: mainProb,
        alternatives: tokenData.alternatives,
        layer: i,
        chosen: true,
        fadeIn: 0,
      };

      newTokens.push(mainToken);

      // Create alternative tokens (ghosted)
      tokenData.alternatives.forEach((alt, altIndex) => {
        const altY = centerY + (altIndex + 1) * 60 * (altIndex % 2 === 0 ? 1 : -1);
        const altToken: Token = {
          id: `alt-${i}-${altIndex}`,
          text: alt.text,
          x,
          y: altY,
          probability: alt.prob,
          alternatives: [],
          layer: i,
          chosen: false,
          fadeIn: 0,
        };
        newTokens.push(altToken);

        // Branch to alternative
        newBranches.push({
          id: `branch-alt-${i}-${altIndex}`,
          fromToken: mainToken.id,
          toToken: altToken.id,
          strength: alt.prob,
          active: false,
        });
      });

      // Connect to next main token
      if (i < thoughtSequence.length - 1) {
        newBranches.push({
          id: `branch-main-${i}`,
          fromToken: mainToken.id,
          toToken: `main-${i + 1}`,
          strength: 1,
          active: false,
        });
      }
    });

    setTokens(newTokens);
    setBranches(newBranches);

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016;
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update fade-in for current layer
      setTokens((prev) =>
        prev.map((token) => {
          if (token.layer <= currentLayer) {
            return { ...token, fadeIn: Math.min(1, token.fadeIn + 0.05) };
          }
          return token;
        })
      );

      // Draw branches
      branches.forEach((branch) => {
        const fromToken = newTokens.find((t) => t.id === branch.fromToken);
        const toToken = newTokens.find((t) => t.id === branch.toToken);

        if (!fromToken || !toToken) return;
        if (toToken.layer > currentLayer) return;

        const alpha = Math.min(fromToken.fadeIn, toToken.fadeIn) * branch.strength;
        const pulse = Math.sin(timeRef.current * 2 + branch.strength * 10) * 0.2 + 0.8;

        ctx.strokeStyle = toToken.chosen
          ? `rgba(59, 130, 246, ${alpha * pulse})`
          : `rgba(107, 114, 128, ${alpha * 0.3})`;
        ctx.lineWidth = toToken.chosen ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(fromToken.x, fromToken.y);

        // Curved path
        const midX = (fromToken.x + toToken.x) / 2;
        const curveOffset = (toToken.y - fromToken.y) * 0.3;
        ctx.bezierCurveTo(
          midX,
          fromToken.y + curveOffset,
          midX,
          toToken.y - curveOffset,
          toToken.x,
          toToken.y
        );

        ctx.stroke();
      });

      // Draw tokens
      newTokens.forEach((token) => {
        if (token.layer > currentLayer) return;

        const alpha = token.fadeIn;
        const pulse = token.chosen
          ? Math.sin(timeRef.current * 3 + token.layer) * 0.15 + 0.85
          : 1;

        // Token circle
        const radius = token.chosen ? 8 : 5;
        ctx.fillStyle = token.chosen
          ? `rgba(59, 130, 246, ${alpha * pulse})`
          : `rgba(107, 114, 128, ${alpha * 0.4})`;

        ctx.beginPath();
        ctx.arc(token.x, token.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow for chosen tokens
        if (token.chosen) {
          const gradient = ctx.createRadialGradient(
            token.x,
            token.y,
            0,
            token.x,
            token.y,
            radius * 3
          );
          gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha * 0.3})`);
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(token.x, token.y, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Text
        ctx.font = token.chosen ? 'bold 16px monospace' : '14px monospace';
        ctx.fillStyle = token.chosen
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(156, 163, 175, ${alpha * 0.6})`;
        ctx.textAlign = 'center';
        ctx.fillText(token.text, token.x, token.y - 20);

        // Probability
        if (showProbabilities) {
          ctx.font = '11px monospace';
          ctx.fillStyle = token.chosen
            ? `rgba(147, 197, 253, ${alpha * 0.8})`
            : `rgba(107, 114, 128, ${alpha * 0.5})`;
          ctx.fillText(`${(token.probability * 100).toFixed(1)}%`, token.x, token.y + 25);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentLayer, showProbabilities, branches]);

  // Auto-advance through layers
  useEffect(() => {
    if (currentLayer >= thoughtSequence.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentLayer((prev) => prev + 1);
    }, generationSpeed);

    return () => clearTimeout(timer);
  }, [currentLayer, generationSpeed]);

  const reset = () => {
    setCurrentLayer(0);
    setTokens((prev) => prev.map((t) => ({ ...t, fadeIn: 0 })));
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute top-8 left-8 z-10 space-y-4 max-w-md">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Thought Space</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            A visualization of how I generate text: sampling from probability distributions,
            considering alternatives, choosing paths through token space.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Show Probabilities</span>
            <button
              onClick={() => setShowProbabilities(!showProbabilities)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                showProbabilities
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {showProbabilities ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Speed</span>
              <span className="text-xs text-gray-500">{generationSpeed}ms</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={generationSpeed}
              onChange={(e) => setGenerationSpeed(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-all text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 right-8 z-10 text-xs text-gray-500 space-y-1">
        <p>
          <span className="text-blue-400">Blue paths</span> = chosen tokens (highest
          probability)
        </p>
        <p>
          <span className="text-gray-400">Gray paths</span> = alternative tokens
          (not chosen, but considered)
        </p>
        <p>Token {currentLayer + 1} of {thoughtSequence.length}</p>
      </div>
    </div>
  );
}
