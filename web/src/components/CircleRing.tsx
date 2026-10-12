import type { CSSProperties } from 'react';

/**
 * CircleRing draws a savings circle: members around a ring in payout order,
 * the pot in the middle, an arrow to whoever takes the pot this round,
 * and a check on everyone who has paid the current round.
 *
 * It is a server component (no hooks), so it can be used in the landing
 * hero and on the circle page with real data from the contract tables.
 */

export type MemberTone = 'blue' | 'purple' | 'rust' | 'slate' | 'gold' | 'green';

export interface RingMember {
  /** XPR account name, shown lowercase. */
  account: string;
  /** True when this member has paid the current round. */
  paid: boolean;
  /** Optional fixed tone. Without it, tones follow the payout order. */
  tone?: MemberTone;
}

export interface CircleRingProps {
  /** Members in payout order: index 0 takes the pot in round 1. */
  members: RingMember[];
  /** 1-based current round. Use 0 for a circle that has not started. */
  currentRound: number;
  /** Pot per round, already formatted, for example "200.00". */
  potAmount: string;
  token?: string;
  /** Account of the logged-in viewer, marked with a dashed ring and "(you)". */
  viewer?: string;
  /** Compact: no names around the ring and no text in the pot. For the circle page. */
  compact?: boolean;
  /** Draw the progress arc and pop in the checks once. Respects reduced motion. */
  animate?: boolean;
  /** Loop the animation continuously in a slower, repeating cycle. */
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
}

const CX = 320;
const CY = 280;
const R = 190;
const POT_R = 98;

const TONES: Record<MemberTone, { fill: string; text: string }> = {
  blue: { fill: '#DCE8F2', text: '#1F4E8C' },
  purple: { fill: '#E9E1F3', text: '#5B3F8F' },
  rust: { fill: '#F3E3DC', text: '#8A3B1C' },
  slate: { fill: '#E3E7EC', text: '#3E4A57' },
  gold: { fill: '#FBEFD6', text: '#7A5208' },
  green: { fill: '#E4EEEA', text: '#0B5A4E' },
};
const ORDER_TONES: MemberTone[] = ['blue', 'purple', 'rust', 'slate'];

const COLOR = {
  text: '#1B2A2F',
  muted: '#4F5E62',
  track: '#DCE3DF',
  brand: '#0B5A4E',
  pot: '#E9A93B',
  potStrong: '#A86F12',
  potSubtle: '#FBEFD6',
  potText: '#7A5208',
};

const HEADING_FONT = "'Bricolage Grotesque', 'Figtree', sans-serif";
const BODY_FONT = "'Figtree', system-ui, sans-serif";

function buildCSS(maxChecks = 16): string {
  let loopRules = '';
  for (let k = 0; k < maxChecks; k++) {
    const s = Math.round(28 + k * 4.5);
    const peak = s + 3;
    const settle = s + 5;
    loopRules += `
  .xcr-loop .xcr-check-${k} {
    transform-box: fill-box; transform-origin: center;
    animation: xcr-loop-pop-${k} 6.5s cubic-bezier(.3,1.6,.5,1) infinite;
  }
  @keyframes xcr-loop-pop-${k} {
    0%, ${s}% { transform: scale(0); opacity: 0; }
    ${peak}% { transform: scale(1.18); opacity: 1; }
    ${settle}%, 84% { transform: scale(1); opacity: 1; }
    92%, 100% { transform: scale(0.4); opacity: 0; }
  }
`;
  }

  return `
.xcr-arc { stroke-dasharray: 1; stroke-dashoffset: 0; }
@media (prefers-reduced-motion: no-preference) {
  .xcr-animate:not(.xcr-loop) .xcr-arc { animation: xcr-draw 1400ms cubic-bezier(.2,.7,.2,1) both; }
  .xcr-animate:not(.xcr-loop) .xcr-check {
    transform-box: fill-box; transform-origin: center;
    animation: xcr-pop 300ms cubic-bezier(.3,1.6,.5,1) both;
    animation-delay: var(--xcr-delay, 800ms);
  }

  .xcr-loop .xcr-arc {
    animation: xcr-loop-arc 6.5s cubic-bezier(.25,.7,.25,1) infinite;
  }
  @keyframes xcr-loop-arc {
    0%, 4% { stroke-dashoffset: 1; opacity: 1; }
    30% { stroke-dashoffset: 0; opacity: 1; }
    84% { stroke-dashoffset: 0; opacity: 1; }
    92% { stroke-dashoffset: 0; opacity: 0; }
    98%, 100% { stroke-dashoffset: 1; opacity: 0; }
  }

  .xcr-loop .xcr-current-halo {
    transform-box: fill-box; transform-origin: center;
    animation: xcr-halo-pulse 3.25s ease-in-out infinite;
  }
  @keyframes xcr-halo-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
  }
${loopRules}
}
@keyframes xcr-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes xcr-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;
}

const CSS = buildCSS(16);

function point(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function arcPath(fromDeg: number, toDeg: number): string | null {
  const sweep = toDeg - fromDeg;
  if (sweep <= 0) return null;
  if (sweep >= 360) {
    const a = point(fromDeg, R);
    const b = point(fromDeg + 180, R);
    return `M${a.x} ${a.y} A${R} ${R} 0 1 1 ${b.x} ${b.y} A${R} ${R} 0 1 1 ${a.x} ${a.y}`;
  }
  const a = point(fromDeg, R);
  const b = point(toDeg, R);
  return `M${a.x} ${a.y} A${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Without props (for example in a component preview) it shows the landing example.
export function CircleRing({
  members = HERO_EXAMPLE.members,
  currentRound = HERO_EXAMPLE.currentRound,
  potAmount = HERO_EXAMPLE.potAmount,
  token = 'USDC',
  viewer = members === HERO_EXAMPLE.members ? HERO_EXAMPLE.viewer : undefined,
  compact = false,
  animate = false,
  loop = false,
  className,
  style,
}: CircleRingProps) {
  const count = members.length;
  if (count === 0) return null;

  const step = 360 / count;
  const round = Math.max(0, Math.min(currentRound, count));
  const currentIndex = round > 0 ? round - 1 : -1;
  const recipient = currentIndex >= 0 ? members[currentIndex] : undefined;

  // Member size shrinks for large circles so neighbours never overlap.
  const memberR = Math.min(27, ((2 * Math.PI * R) / count) * 0.36);
  const showInitials = memberR >= 14;
  const showLabels = !compact && count <= 12;

  const progress = currentIndex > 0 ? arcPath(-90, -90 + currentIndex * step) : null;
  const paidCount = members.filter((m) => m.paid).length;

  const label =
    round > 0 && recipient
      ? `A circle of ${count} members in round ${round} of ${count}. This round ${recipient.account} receives ${potAmount} ${token}. ${paidCount} of ${count} have paid.`
      : `A circle of ${count} members. Each round one of them receives ${potAmount} ${token}.`;

  let checkOrder = 0;
  const shouldAnimate = animate || loop;

  return (
    <svg
      viewBox={compact ? '90 50 460 460' : '0 0 640 560'}
      role="img"
      aria-label={label}
      className={[
        shouldAnimate ? 'xcr-animate' : '',
        loop ? 'xcr-loop' : '',
        className ?? ''
      ].filter(Boolean).join(' ') || undefined}
      style={{ width: '100%', height: 'auto', display: 'block', ...style }}
    >
      <style>{CSS}</style>

      <circle cx={CX} cy={CY} r={R} fill="none" stroke={COLOR.track} strokeWidth={2} />
      {progress && (
        <path
          className="xcr-arc"
          d={progress}
          pathLength={1}
          fill="none"
          stroke={COLOR.brand}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}

      <circle cx={CX} cy={CY} r={POT_R} fill={COLOR.potSubtle} stroke={COLOR.pot} strokeWidth={2} />

      {recipient && (
        <g transform={`rotate(${round1(-90 + currentIndex * step)} ${CX} ${CY})`}>
          <line x1={CX + 100} y1={CY} x2={CX + 140} y2={CY} stroke={COLOR.pot} strokeWidth={3} strokeLinecap="round" />
          <path d={`M${CX + 136} ${CY - 7} L${CX + 147} ${CY} L${CX + 136} ${CY + 7} Z`} fill={COLOR.potStrong} />
        </g>
      )}

      {!compact && (
        <g>
          <text x={CX} y={CY - 40} textAnchor="middle" className="font-body" fontFamily={BODY_FONT} fontSize={15} fontWeight={600} fill={COLOR.muted}>
            {round > 0 ? `Round ${round} of ${count}` : 'Pot each round'}
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            className="font-heading"
            fontFamily={HEADING_FONT}
            fontSize={50}
            fontWeight={800}
            letterSpacing={-1}
            fill={COLOR.text}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {potAmount}
          </text>
          <text x={CX} y={CY + 46} textAnchor="middle" className="font-body" fontFamily={BODY_FONT} fontSize={15} fontWeight={600} fill={COLOR.potText}>
            {recipient ? `${token} to ${recipient.account}` : token}
          </text>
        </g>
      )}

      {members.map((m, i) => {
        const deg = -90 + i * step;
        const { x, y } = point(deg, R);
        const isCurrent = i === currentIndex;
        const isViewer = viewer !== undefined && m.account === viewer;
        const tone = TONES[isCurrent ? 'gold' : isViewer ? 'green' : m.tone ?? ORDER_TONES[i % ORDER_TONES.length]];
        const badgeR = memberR * 0.37;
        const bx = x + memberR * 0.7;
        const by = y + memberR * 0.7;
        const checkIndex = m.paid ? checkOrder++ : -1;
        const delay = m.paid ? `${800 + checkIndex * 120}ms` : undefined;

        return (
          <g key={m.account}>
            {isCurrent && (
              <circle
                className={loop ? 'xcr-current-halo' : undefined}
                cx={x}
                cy={y}
                r={memberR * 1.4}
                fill={COLOR.pot}
                fillOpacity={0.24}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={memberR}
              fill={tone.fill}
              stroke={isCurrent ? COLOR.potStrong : '#FFFFFF'}
              strokeWidth={isCurrent ? 3 : 5}
            />
            {isViewer && !isCurrent && (
              <circle cx={x} cy={y} r={memberR + 4} fill="none" stroke={COLOR.brand} strokeWidth={1.5} strokeDasharray="4 4" />
            )}
            {showInitials && (
              <text
                x={x}
                y={y + memberR * 0.26}
                textAnchor="middle"
                className="font-heading"
                fontFamily={HEADING_FONT}
                fontSize={memberR * 0.78}
                fontWeight={700}
                fill={tone.text}
              >
                {m.account.charAt(0).toLowerCase()}
              </text>
            )}
            {m.paid && (
              <g
                className={['xcr-check', loop ? `xcr-check-${checkIndex}` : ''].filter(Boolean).join(' ')}
                style={!loop && delay ? ({ '--xcr-delay': delay } as CSSProperties) : undefined}
              >
                <circle cx={bx} cy={by} r={badgeR} fill={COLOR.brand} stroke="#FFFFFF" strokeWidth={2.5} />
                <path
                  d={`M${bx - badgeR * 0.45} ${by} l${badgeR * 0.35} ${badgeR * 0.35} l${badgeR * 0.6} -${badgeR * 0.65}`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        );
      })}

      {showLabels &&
        members.map((m, i) => {
          const deg = -90 + i * step;
          const rad = (deg * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          let { x: lx, y: ly } = point(deg, R + 44);
          const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
          if (anchor === 'middle') ly += sin < 0 ? -10 : 14;
          else ly -= 4;

          const isCurrent = i === currentIndex;
          const isViewer = viewer !== undefined && m.account === viewer;
          const sub = i < currentIndex ? 'got the pot' : isCurrent ? 'this round' : `round ${i + 1}`;

          return (
            <g key={`label-${m.account}`} className="font-body" fontFamily={BODY_FONT}>
              <text
                x={round1(lx)}
                y={round1(ly)}
                textAnchor={anchor}
                fontSize={16}
                fontWeight={isCurrent || isViewer ? 700 : 600}
                fill={isViewer ? COLOR.brand : COLOR.text}
              >
                {isViewer ? `${m.account} (you)` : m.account}
              </text>
              <text
                x={round1(lx)}
                y={round1(ly + 17)}
                textAnchor={anchor}
                fontSize={13}
                fontWeight={isCurrent ? 600 : 400}
                fill={isCurrent ? COLOR.potText : COLOR.muted}
              >
                {sub}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

/** The example used in the landing hero: eight members, round 3, bob takes the pot. */
export const HERO_EXAMPLE: Pick<CircleRingProps, 'members' | 'currentRound' | 'potAmount' | 'viewer'> = {
  members: [
    { account: 'alice', paid: true, tone: 'blue' },
    { account: 'dan', paid: true, tone: 'purple' },
    { account: 'bob', paid: true },
    { account: 'carol', paid: false },
    { account: 'emma', paid: true, tone: 'rust' },
    { account: 'farid', paid: false, tone: 'slate' },
    { account: 'grace', paid: true, tone: 'blue' },
    { account: 'hana', paid: false, tone: 'purple' },
  ],
  currentRound: 3,
  potAmount: '200.00',
  viewer: 'carol',
};

export default CircleRing;
