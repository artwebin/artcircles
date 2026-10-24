export interface ScheduleRound {
  round: number;
  deadlineSec: number;
  deadlineDate: Date;
  deadlineFormatted: string;
}

export interface CircleSchedule {
  rounds: ScheduleRound[];
  currentRoundDeadline: ScheduleRound | null;
  getRoundDeadline: (round: number) => ScheduleRound | null;
  formatDueIn: (deadlineSec: number, chainTimeSec?: number) => string;
  formatDeadline: (date: Date) => string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a Date object in the user's local time:
 * If includeTime is true: "Sun 25 Oct at 07:29"
 * If includeTime is false: "Sun 25 Oct"
 */
export function formatDeadline(date: Date, includeTime = true): string {
  const dayName = DAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  if (!includeTime) {
    return `${dayName} ${day} ${month}`;
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${dayName} ${day} ${month} at ${hours}:${mins}`;
}

/**
 * Formats a short deadline (e.g. for table rows):
 * "Sun 25 Oct at 07:29"
 */
export function formatShortDeadline(date: Date): string {
  return formatDeadline(date);
}

/**
 * Returns human-readable relative time until deadline:
 * "due in 2 days", "due tomorrow", "due in 5 hours", "due in less than an hour", "deadline passed"
 */
export function formatDueIn(deadlineSec: number, chainTimeSec?: number): string {
  const now = chainTimeSec ?? Math.floor(Date.now() / 1000);
  const diffSec = deadlineSec - now;
  if (diffSec <= 0) return "deadline passed";

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);

  if (days >= 2) return `due in ${days} days`;
  if (days === 1) return `due tomorrow`;
  if (hours > 1) return `due in ${hours} hours`;
  return `due in less than an hour`;
}

/**
 * Computes exact on-chain round deadlines:
 * deadline(r) = roundStart + (r - round + 1) * periodSec
 * Member at slot s receives the pot at the deadline of round s.
 */
export function getSchedule(
  circle: {
    round: number;
    roundStart: number;
    periodSec: number;
    maxMembers: number;
    state: number;
  },
  chainTimeSec?: number
): CircleSchedule {
  const rounds: ScheduleRound[] = [];

  if (circle.state >= 1 && circle.roundStart > 0 && circle.periodSec > 0) {
    for (let r = 1; r <= circle.maxMembers; r++) {
      const deadlineSec = circle.roundStart + (r - circle.round + 1) * circle.periodSec;
      const deadlineDate = new Date(deadlineSec * 1000);
      rounds.push({
        round: r,
        deadlineSec,
        deadlineDate,
        deadlineFormatted: formatDeadline(deadlineDate),
      });
    }
  }

  const getRoundDeadline = (roundNum: number): ScheduleRound | null => {
    return rounds.find((rd) => rd.round === roundNum) || null;
  };

  const currentRoundDeadline = getRoundDeadline(circle.round);

  return {
    rounds,
    currentRoundDeadline,
    getRoundDeadline,
    formatDueIn: (sec, ct) => formatDueIn(sec, ct ?? chainTimeSec),
    formatDeadline,
  };
}
