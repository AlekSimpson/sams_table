// VIEW layer — full character sheet display
import { useEffect, useState } from 'react'
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { CharacterSheetProps } from '../types/app_types'
import { DNDCharacter } from '../types/dnd_types'
import { Avatar, Button, Card, Input, Panel, Sidebar } from './components'
import ConditionBadge from './condition_badge'
import '../../styles/character_sheet.css'

// Placeholder passed to character_sheet_model() when the real character hasn't
// loaded yet, so that model's hooks are still called unconditionally on every
// render (see CharacterSheet below) — its values are never rendered since the
// "not found" early-return happens after the model is created but before any
// JSX referencing it is produced.
const placeholder_character: DNDCharacter = {
  id: '',
  campaign_id: '',
  name: '',
  class: '',
  race: '',
  level: 0,
  max_hp: 0,
  current_hp: 0,
  armor_class: 0,
  speed: 0,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  skill_profs: [],
  conditions: [],
  equipment: [],
  notes: '',
  created_at: '',
}

function CombatTab() {
  return (
    <div>
      <div className="cs__section">
        <div className="cs__section-label">Attacks</div>
        <div className="cs__attacks-table">
          <div className="cs__attacks-head">
            <span>Name</span>
            <span>Range</span>
            <span>Hit / DC</span>
            <span>Damage</span>
          </div>
          <div className="cs__attacks-empty">No weapons added yet</div>
        </div>
      </div>

      <div className="cs__section">
        <div className="cs__section-label">Effects</div>
        <Card className="cs__effect-card">
          <div>
            <div className="cs__effect-title">Global Attack Modifier</div>
            <div className="cs__effect-sub">No active effect</div>
          </div>
          <Button variant="secondary" size="small">Modify</Button>
        </Card>
      </div>

      <div className="cs__section">
        <div className="cs__section-label">Actions</div>
        <div className="cs__action-block">
          <div className="cs__action-name">Actions in Combat</div>
          <div className="cs__action-desc">
            Attack, Cast a Spell, Dash, Disengage, Dodge, Grapple, Help, Hide, Improvise, Ready, Search, Shove, Use an Object
          </div>
        </div>
        <div className="cs__action-block">
          <div className="cs__action-name">Bonus Actions</div>
          <div className="cs__action-desc cs__action-desc--empty">No bonus actions defined yet</div>
        </div>
        <div className="cs__action-block">
          <div className="cs__action-name">Reactions</div>
          <div className="cs__action-desc cs__action-desc--empty">No reactions defined yet</div>
        </div>
      </div>
    </div>
  )
}

function ScaffoldTab({ label }: { label: string }) {
  return (
    <div className="scaffold-placeholder" style={{ marginTop: 8 }}>
      {label} — coming soon
    </div>
  )
}

function EquipmentTab({
  equipment,
  on_equipment_add,
  on_equipment_remove,
}: {
  equipment: string[]
  on_equipment_add: (item_name: string) => void
  on_equipment_remove: (item_index: number) => void
}) {
  const [new_item_name, set_new_item_name] = useState('')

  const on_add_click = () => {
    on_equipment_add(new_item_name)
    set_new_item_name('')
  }

  const on_new_item_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      on_add_click()
    }
  }

  return (
    <div className="cs__section">
      <div className="cs__section-label">Equipment</div>
      <div className="cs__equipment-add-row">
        <Input
          value={new_item_name}
          onChange={(event) => set_new_item_name(event.target.value)}
          onKeyDown={on_new_item_key_down}
          placeholder="Add equipment item"
        />
        <Button variant="secondary" size="small" onClick={on_add_click}>Add</Button>
      </div>
      {equipment.length === 0 ? (
        <div className="cs__attacks-empty">No equipment added yet</div>
      ) : (
        <ul className="cs__equipment-list">
          {equipment.map((item, item_index) => (
            <li key={item_index} className="cs__equipment-item">
              <span>{item}</span>
              <button
                type="button"
                className="cs__equipment-remove"
                onClick={() => on_equipment_remove(item_index)}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function CharacterSheet({ character_id }: CharacterSheetProps) {
  const { characters, character_sheet_model, load_character } = character_viewmodel()

  useEffect(() => {
    load_character(character_id)
  }, [character_id])

  const character = characters[character_id]
  const model = character_sheet_model(character ?? placeholder_character)
  if (!character) return <div className="cs__not-found">Character not found</div>

  const hp_pct = model.health_percentage
  const hp_color = hp_pct > 50 ? 'var(--color-success)' : hp_pct > 25 ? 'var(--color-warning)' : 'var(--color-danger)'

  const on_hp_dec = model.on_current_hp_step(-1)
  const on_hp_inc = model.on_current_hp_step(1)

  const ability_mod_color = (score: number) => {
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? 'var(--color-accent)' : modifier < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)'
  }

  const save_color = (score: number) => {
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? 'var(--color-success)' : modifier < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)'
  }

  const skill_mod_color = (proficient: boolean, score: number) => {
    if (proficient) return 'var(--color-accent)'
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? 'var(--color-success)' : 'var(--color-text-quaternary)'
  }

  return (
    <div className="cs">

      {/* ── Main column ── */}
      <div className="cs__main">

        {/* Identity strip */}
        <div className="cs__identity">
          <Avatar
            label={character.name?.[0]?.toUpperCase() ?? '?'}
            badge={character.level > 0 ? character.level : undefined}
          />

          <div className="cs__identity-body">
            <input
              className="cs__char-name"
              value={character.name}
              onChange={model.on_name_change}
              placeholder="Character Name"
            />
            <div className="cs__char-tags">
              <input
                className="cs__tag cs__tag--class"
                value={character.class}
                onChange={model.on_class_change}
                placeholder="Class"
              />
              <input
                className="cs__tag cs__tag--race"
                value={character.race}
                onChange={model.on_race_change}
                placeholder="Race"
              />
            </div>
          </div>

          <div className="cs__id-stats">
            <div className="cs__id-stat">
              <span className="cs__id-stat-val cs__id-stat-val--red">+{model.bonus}</span>
              <span className="cs__id-stat-lbl">Proficiency</span>
            </div>
            <div
              className="cs__id-stat"
              onClick={model.on_inspiration_toggle}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <span className={`cs__id-stat-val ${model.inspiration ? 'cs__id-stat-val--red' : 'cs__id-stat-val--dim'}`}>
                {model.inspiration ? '1' : 'I'}
              </span>
              <span className="cs__id-stat-lbl">Inspiration</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="cs__stats-grid">

          {/* Abilities (260px) */}
          <Panel className="cs__stats-panel">
            <span className="cs__panel-label">Abilities</span>
            <div className="cs__ability-grid">
              {model.ABILITIES.map(({ key, label }) => (
                <div key={key} className="cs__ability-card">
                  <span className="cs__ability-label">{key.toUpperCase()}</span>
                  <span className="cs__ability-mod" style={{ color: ability_mod_color(character.stats[key]) }}>
                    {model.format_modifier(character.stats[key])}
                  </span>
                  <input
                    className="cs__ability-score"
                    type="number"
                    value={character.stats[key]}
                    onChange={model.on_stat_change(key)}
                    title={label}
                  />
                </div>
              ))}
            </div>
          </Panel>

          {/* Saving Throws (200px) */}
          <Panel className="cs__stats-panel">
            <span className="cs__panel-label">Saving Throws</span>
            {model.ABILITIES.map(({ key }) => (
              <div key={key} className="cs__save-row">
                <span className="cs__save-dot" />
                <span className="cs__save-key">{key.toUpperCase()}</span>
                <span className="cs__save-val" style={{ color: save_color(character.stats[key]) }}>
                  {model.format_modifier(character.stats[key])}
                </span>
              </div>
            ))}
          </Panel>

          {/* Hit Points (flex: 1) */}
          <Panel className="cs__stats-panel">
            <span className="cs__panel-label">Hit Points</span>
            <div className="cs__hp-row">
              <input
                className="cs__hp-num"
                type="number"
                value={character.current_hp}
                onChange={model.on_current_hp_change}
                onFocus={model.on_current_hp_focus}
                onBlur={model.on_current_hp_blur}
                style={{ color: hp_color }}
                title="Current HP"
              />
              <span className="cs__hp-sep">/</span>
              <input
                className="cs__hp-max"
                type="number"
                value={character.max_hp}
                onChange={model.on_max_hp_change}
                title="Max HP"
              />
              <span className="cs__hp-max-label">max</span>
            </div>
            <div className="cs__hp-bar">
              <div className={`cs__hp-bar-fill${model.hp_bar_class}`} style={{ width: `${hp_pct}%` }} />
            </div>
            <div className="cs__hp-controls">
              <button className="cs__hp-btn cs__hp-btn--dec" onClick={on_hp_dec}>−</button>
              <button className="cs__hp-btn cs__hp-btn--inc" onClick={on_hp_inc}>+</button>
              <Button variant="secondary" size="small" className="cs__rest-btn">☽ Short</Button>
              <Button variant="secondary" size="small" className="cs__rest-btn">✦ Long</Button>
            </div>
          </Panel>
        </div>

        {/* Vitals bar */}
        <Panel className="cs__vitals-bar">
          <div className="cs__vital">
            <input
              className="cs__vital-val cs__vital-val--plain"
              type="number"
              value={character.armor_class}
              onChange={model.on_ac_change}
            />
            <span className="cs__vital-lbl">Armor Class</span>
          </div>
          <div className="cs__vital">
            <input
              className="cs__vital-val cs__vital-val--teal"
              type="number"
              value={character.speed}
              onChange={model.on_speed_change}
            />
            <span className="cs__vital-lbl">Speed</span>
          </div>
          <div className="cs__vital">
            <span className="cs__vital-val cs__vital-val--gold">
              {model.format_modifier(character.stats['dex'])}
            </span>
            <span className="cs__vital-lbl">Initiative</span>
          </div>
          <div className="cs__vital">
            <span className="cs__vital-val cs__vital-val--red">+{model.bonus}</span>
            <span className="cs__vital-lbl">Proficiency</span>
          </div>
          <div className="cs__vital">
            <input
              className="cs__vital-val cs__vital-val--plain"
              type="number"
              value={character.level}
              onChange={model.on_level_change}
            />
            <span className="cs__vital-lbl">Level</span>
          </div>
        </Panel>

        {/* Tab bar */}
        <div className="cs__tab-bar">
          {model.TABS.map(tab => (
            <button
              key={tab.id}
              className={`cs__tab-btn${model.active_tab === tab.id ? ' cs__tab-btn--active' : ''}`}
              onClick={model.on_tab_select(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="cs__tab-body">

          {/* Tab content */}
          <div className="cs__tab-content">
            {model.active_tab === 'combat'    && <CombatTab />}
            {model.active_tab === 'spells'    && <ScaffoldTab label="Spells" />}
            {model.active_tab === 'equipment' && (
              <EquipmentTab
                equipment={character.equipment}
                on_equipment_add={model.on_equipment_add}
                on_equipment_remove={model.on_equipment_remove}
              />
            )}
            {model.active_tab === 'features'  && <ScaffoldTab label="Features & Traits" />}
            {model.active_tab === 'notes'     && (
              <textarea
                className="cs__notes"
                value={character.notes}
                placeholder="No notes yet"
                onChange={model.on_notes_change}
              />
            )}
          </div>

          {/* Skills panel */}
          <Panel className="cs__skills-panel">
            <div className="cs__skills-header">
              <span className="cs__panel-label">Skills</span>
            </div>
            <div className="cs__skills-grid">
              {model.SKILLS.map(skill => {
                const prof = model.is_skill_proficient(skill.key)
                return (
                  <div key={skill.key} className="cs__skill-row">
                    <span className={`cs__skill-dot${prof ? ' cs__skill-dot--prof' : ''}`} />
                    <span className="cs__skill-ab">{skill.ability.toUpperCase()}</span>
                    <span className="cs__skill-name">{skill.name}</span>
                    <span
                      className="cs__skill-mod"
                      style={{ color: skill_mod_color(prof, character.stats[skill.ability]) }}
                    >
                      {model.format_skill_modifier(skill)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <Sidebar side="right" className="cs__aside">

        <Panel className="cs__aside-section">
          <div className="cs__aside-header"><span>Defenses</span><hr /></div>
          <div className="cs__aside-row">
            <span className="cs__aside-key">Resistance</span>
            <span className="cs__aside-val cs__aside-val--empty">None</span>
          </div>
          <div className="cs__aside-row">
            <span className="cs__aside-key">Immunity</span>
            <span className="cs__aside-val cs__aside-val--empty">None</span>
          </div>
          <div className="cs__aside-row">
            <span className="cs__aside-key">Vulnerability</span>
            <span className="cs__aside-val cs__aside-val--empty">None</span>
          </div>
        </Panel>

        <Panel className="cs__aside-section">
          <div className="cs__aside-header"><span>Conditions</span><hr /></div>
          {character.conditions.length === 0 ? (
            <p className="cs__aside-empty">No active conditions</p>
          ) : (
            <div className="cs__conditions-list">
              {character.conditions.map(condition => (
                <ConditionBadge key={condition} condition={condition} />
              ))}
            </div>
          )}
        </Panel>

        <Panel className="cs__aside-section">
          <div className="cs__aside-header"><span>Senses</span><hr /></div>
          <div className="cs__sense-row">
            <div>
              <div className="cs__sense-label">Passive Perception</div>
              <div className="cs__sense-sub">WIS</div>
            </div>
            <span className="cs__sense-val">{10 + model.ability_modifier(character.stats['wis'])}</span>
          </div>
          <div className="cs__sense-row">
            <div>
              <div className="cs__sense-label">Passive Investigation</div>
              <div className="cs__sense-sub">INT</div>
            </div>
            <span className="cs__sense-val">{10 + model.ability_modifier(character.stats['int'])}</span>
          </div>
          <div className="cs__sense-row">
            <div>
              <div className="cs__sense-label">Passive Insight</div>
              <div className="cs__sense-sub">WIS</div>
            </div>
            <span className="cs__sense-val">{10 + model.ability_modifier(character.stats['wis'])}</span>
          </div>
          <div className="cs__sense-row">
            <div><div className="cs__sense-label">Darkvision</div></div>
            <span className="cs__sense-val cs__sense-val--empty">—</span>
          </div>
        </Panel>

        <Panel className="cs__aside-section">
          <div className="cs__aside-header"><span>Proficiencies</span><hr /></div>
          <div className="cs__prof-group">
            <span className="cs__prof-label">Weapons</span>
            <textarea className="cs__prof-textarea" placeholder="Not set" rows={1} />
          </div>
          <div className="cs__prof-group">
            <span className="cs__prof-label">Armor</span>
            <textarea className="cs__prof-textarea" placeholder="Not set" rows={1} />
          </div>
          <div className="cs__prof-group">
            <span className="cs__prof-label">Tools</span>
            <textarea className="cs__prof-textarea" placeholder="Not set" rows={1} />
          </div>
          <div className="cs__prof-group">
            <span className="cs__prof-label">Languages</span>
            <textarea className="cs__prof-textarea" placeholder="Not set" rows={1} />
          </div>
        </Panel>

      </Sidebar>
    </div>
  )
}
