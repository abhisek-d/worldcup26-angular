export interface Match {
  id?: string | number;
  home_team?: string;
  home?: string;
  team1?: string;
  away_team?: string;
  away?: string;
  team2?: string;
  stage?: string;
  phase?: string;
  round?: string;
  group?: string;
  date?: string;
  datetime?: string;
  match_date?: string;
  local_date?: string;
  stadium?: string;
  venue?: string;
  city?: string;
  home_score?: number | null;
  away_score?: number | null;
}

export interface Team {
  id?: string | number;
  name?: string;
  country?: string;
  group?: string;
  flag?: string;
  coach?: string;
  fifa_rank?: number;
  confederation?: string;
}

export interface GroupStanding {
  team?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goals_for?: number;
  goals_against?: number;
  goal_difference?: number;
  points?: number;
}

export interface Group {
  id?: string | number;
  name?: string;
  group?: string;
  teams?: Array<Team | string>;
  standings?: GroupStanding[];
}

export interface Stadium {
  id?: string | number;
  name?: string;
  city?: string;
  country?: string;
  capacity?: number;
  surface?: string;
  timezone?: string;
}
