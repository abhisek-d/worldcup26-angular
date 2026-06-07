export interface Match {
  _id?: string;
  id?: string;
  home_team_id?: string;
  away_team_id?: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_name_fa?: string;
  away_team_name_fa?: string;
  home_score?: string;
  away_score?: string;
  home_scorers?: string;
  away_scorers?: string;
  group?: string;
  matchday?: string;
  local_date?: string;
  persian_date?: string;
  stadium_id?: string;
  finished?: string;
  time_elapsed?: string;
  type?: string;
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
