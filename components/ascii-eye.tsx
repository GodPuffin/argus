'use client';
import { useEffect, useRef, useMemo, memo } from 'react';
import { ASCII_EYE_ART } from './ascii-eye-art';

// Extract unique Braille characters for scrambling (cached)
const brailleChars = Array.from(new Set(ASCII_EYE_ART.split('').filter(char => char !== '\n' && char !== ' ')));

// Pre-generate color palette to avoid expensive calculations
const COLOR_PALETTE_SIZE = 50;
const colorPalette: string[] = [];
const darkColorPalette: string[] = [];

// Initialize color palettes once
function initColorPalettes() {
  if (colorPalette.length > 0) return;
  
  for (let i = 0; i < COLOR_PALETTE_SIZE; i++) {
    const hue = Math.random() * 10;
    const saturation = Math.random() * 0.6 + 0.4;
    const lightness = Math.random() * 0.1 + 0.6;
    colorPalette.push(hslToHex(hue, saturation, lightness));
    
    // Dark variant for specific characters
    darkColorPalette.push(hslToHex(hue * 0.1, saturation * 0.5, lightness * 0.7));
  }
}

function hslToHex(h: number, s: number, l: number) {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c/2;

  let r = 0, g = 0, b = 0;
  if (h < 60) [r,g,b] = [c,x,0];
  else if (h < 120) [r,g,b] = [x,c,0];
  else if (h < 180) [r,g,b] = [0,c,x];
  else if (h < 240) [r,g,b] = [0,x,c];
  else if (h < 300) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Get random Braille character (optimized)
function getRandomBrailleChar() {
  return brailleChars[Math.floor(Math.random() * Math.min(10, brailleChars.length))];
}

// Get random color from pre-generated palette
function getRandomColor(isDark = false) {
  const palette = isDark ? darkColorPalette : colorPalette;
  return palette[Math.floor(Math.random() * palette.length)];
}

interface CharData {
  originalChar: string;
  displayChar: string;
  color: string;
  isWhitespace: boolean;
  isDarkChar: boolean;
  key: number;
}

export const AsciiEye = memo(function AsciiEye() {
  const spansRef = useRef<HTMLSpanElement[]>([]);
  const nonWhitespaceIndicesRef = useRef<number[]>([]);
  const rafIdRef = useRef<number | undefined>(undefined);
  const lastColorUpdateRef = useRef<number>(0);
  const lastScrambleUpdateRef = useRef<number>(0);
  const scrambleTimeoutRef = useRef<number | undefined>(undefined);

  // Memoize character data - only parse once
  const charData = useMemo(() => {
    initColorPalettes();
    
    const lines = ASCII_EYE_ART.split('\n');
    const data: CharData[] = [];
    const nonWhitespaceIndices: number[] = [];
    let globalIndex = 0;

    lines.forEach((line, lineIndex) => {
      line.split('').forEach((char) => {
        const isWhitespace = char === ' ' || char === '\n';
        const isDarkChar = char === '⠂' || char === '⠁' || char === '⠀';
        
        data.push({
          originalChar: char,
          displayChar: char,
          color: isWhitespace ? '' : getRandomColor(isDarkChar),
          isWhitespace,
          isDarkChar,
          key: globalIndex,
        });
        
        if (!isWhitespace) {
          nonWhitespaceIndices.push(globalIndex);
        }
        
        globalIndex++;
      });
      
      if (lineIndex < lines.length - 1) {
        data.push({
          originalChar: '\n',
          displayChar: '\n',
          color: '',
          isWhitespace: true,
          isDarkChar: false,
          key: globalIndex++,
        });
      }
    });

    nonWhitespaceIndicesRef.current = nonWhitespaceIndices;
    return data;
  }, []);

  // Optimized animation loop using requestAnimationFrame
  useEffect(() => {
    let isActive = true;
    
    const animate = (timestamp: number) => {
      if (!isActive) return;

      // Color update - every 800ms, but only update a batch of characters
      if (timestamp - lastColorUpdateRef.current >= 800) {
        lastColorUpdateRef.current = timestamp;
        
        // Batch update colors - only update a subset for better performance
        const batchSize = Math.ceil(nonWhitespaceIndicesRef.current.length / 3);
        const startIdx = Math.floor(Math.random() * (nonWhitespaceIndicesRef.current.length - batchSize));
        
        for (let i = startIdx; i < startIdx + batchSize && i < nonWhitespaceIndicesRef.current.length; i++) {
          const idx = nonWhitespaceIndicesRef.current[i];
          const char = charData[idx];
          const span = spansRef.current[idx];
          
          if (span) {
            const newColor = getRandomColor(char.isDarkChar);
            span.style.color = newColor;
          }
        }
      }

      // Character scrambling - every 1000ms
      if (timestamp - lastScrambleUpdateRef.current >= 1000) {
        lastScrambleUpdateRef.current = timestamp;
        
        const numToScramble = 15 + Math.floor(Math.random() * 5);
        const scrambledIndices: number[] = [];
        
        // Scramble random characters
        for (let i = 0; i < numToScramble; i++) {
          const randomIdx = Math.floor(Math.random() * nonWhitespaceIndicesRef.current.length);
          const idx = nonWhitespaceIndicesRef.current[randomIdx];
          scrambledIndices.push(idx);
          
          const span = spansRef.current[idx];
          if (span) {
            span.textContent = getRandomBrailleChar();
          }
        }

        // Reset scrambled characters after delay
        if (scrambleTimeoutRef.current) {
          window.clearTimeout(scrambleTimeoutRef.current);
        }
        
        scrambleTimeoutRef.current = window.setTimeout(() => {
          scrambledIndices.forEach((idx) => {
            const span = spansRef.current[idx];
            if (span) {
              span.textContent = charData[idx].originalChar;
            }
          });
        }, 150);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrambleTimeoutRef.current) {
        window.clearTimeout(scrambleTimeoutRef.current);
      }
    };
  }, [charData]);

  return (
    <div className="h-full w-full pointer-events-auto">
      <pre 
        className="font-medium sm:text-xs select-none"
        style={{ 
          fontFamily: 'monospace',
          willChange: 'transform', // GPU acceleration hint
        }}
      >
        {charData.map((item, idx) => (
          <span 
            key={item.key}
            ref={el => { if (el) spansRef.current[idx] = el; }}
            style={{ color: item.color }}
          >
            {item.displayChar}
          </span>
        ))}
      </pre>
    </div>
  );
});
