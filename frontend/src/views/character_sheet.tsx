// VIEW layer — full character sheet display
import { character_viewmodel } from '../viewmodels/character_viewmodel'
import { CharacterSheetProps } from '../types/app_types'
import '../../styles/CharacterSheet.css'

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
        <div className="cs__effect-card">
          <div>
            <div className="cs__effect-title">Global Attack Modifier</div>
            <div className="cs__effect-sub">No active effect</div>
          </div>
          <button className="btn btn--secondary" style={{ fontSize: 11, padding: '5px 12px' }}>Modify</button>
        </div>
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

export default function CharacterSheet({ character_id }: CharacterSheetProps) {
  const { characters, character_sheet_model } = character_viewmodel()
  const character = characters[character_id]
  if (!character) return <div className="cs__not-found">Character not found</div>
  const model = character_sheet_model(character)

  const hp_pct = model.health_percentage
  const hp_color = hp_pct > 50 ? 'var(--green)' : hp_pct > 25 ? 'var(--gold)' : 'var(--red)'
  const hp_bar_color = hp_pct > 50 ? '#3a7a3a' : hp_pct > 25 ? 'var(--gold)' : 'var(--red)'

  const on_hp_dec = () =>
    model.on_current_hp_change({ target: { value: String(Math.max(0, character.current_hp - 1)) } } as unknown as React.ChangeEvent<HTMLInputElement>)
  const on_hp_inc = () =>
    model.on_current_hp_change({ target: { value: String(Math.min(character.max_hp, character.current_hp + 1)) } } as unknown as React.ChangeEvent<HTMLInputElement>)

  const ability_mod_color = (score: number) => {
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? 'var(--red)' : modifier < 0 ? '#b05050' : 'var(--ink2)'
  }

  const save_color = (score: number) => {
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? 'var(--green)' : modifier < 0 ? 'var(--red)' : 'var(--ink2)'
  }

  const skill_mod_color = (proficient: boolean, score: number) => {
    if (proficient) return 'var(--red)'
    const modifier = model.ability_modifier(score)
    return modifier > 0 ? '#2a5a2a' : 'var(--ink4)'
  }

  return (
    <div className="cs">

      {/* ── Main column ── */}
      <div className="cs__main">

        {/* Identity strip */}
        <div className="cs__identity">
          <div className="cs__avatar">
            {character.name?.[0]?.toUpperCase() ?? '?'}
            {character.level > 0 && <span className="cs__level-badge">{character.level}</span>}
          </div>

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
          <div className="cs__stats-panel">
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
          </div>

          {/* Saving Throws (180px) */}
          <div className="cs__stats-panel">
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
          </div>

          {/* Hit Points (flex: 1) */}
          <div className="cs__stats-panel">
            <span className="cs__panel-label">Hit Points</span>
            <div className="cs__hp-row">
              {/*<span className="cs__hp-num" style={{ color: hp_color }}>{character.current_hp}</span>*/}
              <input
                className="cs__hp-num" 
                type="number"
                value={character.current_hp}
                onChange={model.on_current_hp_change}
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
              <div className="cs__hp-bar-fill" style={{ width: `${hp_pct}%`, background: hp_bar_color }} />
            </div>
            <div className="cs__hp-controls">
              <button className="cs__hp-btn cs__hp-btn--dec" onClick={on_hp_dec}>−</button>
              <button className="cs__hp-btn cs__hp-btn--inc" onClick={on_hp_inc}>+</button>
              <button className="cs__rest-btn">☽ Short</button>
              <button className="cs__rest-btn">✦ Long</button>
            </div>
          </div>
        </div>

        {/* Vitals bar */}
        <div className="cs__vitals-bar">
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
        </div>

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
            {model.active_tab === 'equipment' && <ScaffoldTab label="Equipment" />}
            {model.active_tab === 'features'  && <ScaffoldTab label="Features & Traits" />}
            {model.active_tab === 'notes'     && (
              <textarea className="cs__notes" placeholder="Notes..." />
            )}
          </div>

          {/* Skills panel */}
          <div className="cs__skills-panel">
            <div className="cs__skills-header">
              <span className="cs__panel-label">Skills</span>
            </div>
            <div className="cs__skills-grid">
              {model.SKILLS.map(skill => {
                const prof = model.is_skill_proficient(skill.ability)
                return (
                  <div key={skill.key} className="cs__skill-row">
                    <span className={`cs__skill-dot${prof ? ' cs__skill-dot--prof' : ''}`} />
                    <span className="cs__skill-ab">{skill.ability.toUpperCase()}</span>
                    <span className="cs__skill-name">{skill.name}</span>
                    <span
                      className="cs__skill-mod"
                      style={{ color: skill_mod_color(prof, character.stats[skill.ability]) }}
                    >
                      {model.format_modifier(character.stats[skill.ability])}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <aside className="cs__aside">

        <div className="cs__aside-section">
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
        </div>

        <div className="cs__aside-section">
          <div className="cs__aside-header"><span>Conditions</span><hr /></div>
          {character.conditions.length === 0 ? (
            <p className="cs__aside-empty">No active conditions</p>
          ) : (
            <div className="cs__conditions-list">
              {character.conditions.map(c => (
                <span key={c} className="cs__condition-tag">{c}</span>
              ))}
            </div>
          )}
        </div>

        <div className="cs__aside-section">
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
        </div>

        <div className="cs__aside-section">
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
        </div>

      </aside>
    </div>
  )
}
