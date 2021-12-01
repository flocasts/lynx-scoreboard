export interface LynxResult {
  place: string | null;
  lane: number | null;
  id: number | null;
  name: string;
  team: string;
  time: string;
  delta: string;
  cumulativeSplitTime: string | null;
  lastSplitTime: string | null;
  lapsToGo: number | null;
  license: string | null;
  reactionTime: string | null;
  speed: string | null;
  pace: string | null;
  bestSplit: string | null;
}

export interface LynxEvent {
  status: string;
  eventName: string;
  wind: string | null;
  eventNo: number;
  roundNo: number;
  heatNo: number;
  eventRoundHeat: string;
  startType: string;
}

export interface LynxDirective {
  title: string;
  data: string[];
}

export interface LynxResults {
  event: LynxEvent;
  results: LynxResult[];
}
