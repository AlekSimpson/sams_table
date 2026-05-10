export interface DNDCampaign {
  id: string
  name: string
  description: string
  dm_id: string
  created_at: string
}

export interface DNDCharacter {
  id: string
  campaign_id: string
  player_id?: string
  name: string
  class: string
  race: string
  level: number
  max_hp: number
  current_hp: number
  armor_class: number
  speed: number
  stats: Record<string, number>
  skill_profs: string[]
  conditions: string[]
  created_at: string
}

export interface DNDClass {
  key:                     string
  name:                    string
  hit_die:                 number
  saving_throws:           string[]
  primary_ability:         string[]
  spellcasting_ability?:   string
  armor_proficiencies:     string[]
  weapon_proficiencies:    string[]
  num_skill_proficiencies: number
}

export interface DNDSubrace {
  key:          string
  race_key:     string
  name:         string
  stat_bonuses: Record<string, number>
  traits:       string[]
}

export interface DNDRace {
  key:          string
  name:         string
  stat_bonuses: Record<string, number>
  size:         'Small' | 'Medium' | 'Large'
  base_speed:   number
  traits:       string[]
  subraces?:    DNDSubrace[]
}


