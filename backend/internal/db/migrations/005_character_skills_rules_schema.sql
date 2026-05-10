-- +goose Up

-- Characters: add skill_profs, drop old JSONB columns that are no longer in the model
ALTER TABLE characters ADD COLUMN skill_profs TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE characters DROP COLUMN IF EXISTS saving_throws;
ALTER TABLE characters DROP COLUMN IF EXISTS skills;

-- dnd_classes: rename columns to match struct db tags, drop unused columns
ALTER TABLE dnd_classes RENAME COLUMN saving_throws TO saving_throw_profs;
ALTER TABLE dnd_classes RENAME COLUMN armor_proficiencies TO armor_prof;
ALTER TABLE dnd_classes RENAME COLUMN num_skill_proficiencies TO max_skill_prof_count;
ALTER TABLE dnd_classes DROP COLUMN IF EXISTS primary_ability;
ALTER TABLE dnd_classes DROP COLUMN IF EXISTS spellcasting_ability;
ALTER TABLE dnd_classes DROP COLUMN IF EXISTS weapon_proficiencies;

-- dnd_races: replace JSONB stat_bonuses + size with typed arrays to match struct
ALTER TABLE dnd_races DROP COLUMN IF EXISTS stat_bonuses;
ALTER TABLE dnd_races DROP COLUMN IF EXISTS size;
ALTER TABLE dnd_races ADD COLUMN aik       TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE dnd_races ADD COLUMN aiv       INT[]  NOT NULL DEFAULT '{}';
ALTER TABLE dnd_races ADD COLUMN languages TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE dnd_races ADD COLUMN skill_prof TEXT[] NOT NULL DEFAULT '{}';

-- Re-seed ability increases for existing races
UPDATE dnd_races SET aik='{str,dex,con,int,wis,cha}', aiv='{1,1,1,1,1,1}' WHERE key='human';
UPDATE dnd_races SET aik='{dex}',      aiv='{2}'   WHERE key='elf';
UPDATE dnd_races SET aik='{con}',      aiv='{2}'   WHERE key='dwarf';
UPDATE dnd_races SET aik='{dex}',      aiv='{2}'   WHERE key='halfling';
UPDATE dnd_races SET aik='{cha}',      aiv='{2}'   WHERE key='half_elf';
UPDATE dnd_races SET aik='{str,con}',  aiv='{2,1}' WHERE key='half_orc';
UPDATE dnd_races SET aik='{int}',      aiv='{2}'   WHERE key='gnome';
UPDATE dnd_races SET aik='{str,cha}',  aiv='{2,1}' WHERE key='dragonborn';
UPDATE dnd_races SET aik='{int,cha}',  aiv='{1,2}' WHERE key='tiefling';

-- Skill catalog: name (display), stat (ability key), allowed classes
CREATE TABLE dnd_skills (
    name            TEXT NOT NULL,
    stat            TEXT NOT NULL,
    allowed_classes TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO dnd_skills (name, stat, allowed_classes) VALUES
    ('Acrobatics',      'dex', '{bard,barbarian,fighter,monk,ranger,rogue}'),
    ('Animal Handling', 'wis', '{barbarian,druid,fighter,ranger}'),
    ('Arcana',          'int', '{bard,cleric,druid,ranger,rogue,sorcerer,warlock,wizard,artificer}'),
    ('Athletics',       'str', '{barbarian,bard,fighter,monk,paladin,ranger,rogue}'),
    ('Deception',       'cha', '{bard,rogue,sorcerer,warlock}'),
    ('History',         'int', '{bard,cleric,druid,monk,paladin,rogue,warlock,wizard,artificer}'),
    ('Insight',         'wis', '{bard,cleric,druid,monk,paladin,ranger}'),
    ('Intimidation',    'cha', '{barbarian,bard,fighter,paladin,rogue,sorcerer,warlock}'),
    ('Investigation',   'int', '{artificer,bard,fighter,monk,rogue,wizard}'),
    ('Medicine',        'wis', '{bard,cleric,druid,paladin}'),
    ('Nature',          'int', '{barbarian,bard,druid,fighter,monk,ranger,wizard}'),
    ('Perception',      'wis', '{barbarian,bard,druid,fighter,monk,ranger,rogue}'),
    ('Performance',     'cha', '{bard,rogue}'),
    ('Persuasion',      'cha', '{bard,cleric,paladin,sorcerer,warlock}'),
    ('Religion',        'int', '{cleric,druid,monk,paladin,sorcerer,warlock,wizard}'),
    ('Sleight of Hand', 'dex', '{bard,rogue}'),
    ('Stealth',         'dex', '{barbarian,bard,druid,monk,ranger,rogue}'),
    ('Survival',        'wis', '{barbarian,druid,fighter,ranger}');

-- +goose Down
DROP TABLE IF EXISTS dnd_skills;

ALTER TABLE dnd_races DROP COLUMN IF EXISTS skill_prof;
ALTER TABLE dnd_races DROP COLUMN IF EXISTS languages;
ALTER TABLE dnd_races DROP COLUMN IF EXISTS aiv;
ALTER TABLE dnd_races DROP COLUMN IF EXISTS aik;
ALTER TABLE dnd_races ADD COLUMN size TEXT NOT NULL DEFAULT 'Medium';
ALTER TABLE dnd_races ADD COLUMN stat_bonuses JSONB NOT NULL DEFAULT '{}';

ALTER TABLE dnd_classes ADD COLUMN weapon_proficiencies TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE dnd_classes ADD COLUMN spellcasting_ability TEXT;
ALTER TABLE dnd_classes ADD COLUMN primary_ability TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE dnd_classes RENAME COLUMN max_skill_prof_count TO num_skill_proficiencies;
ALTER TABLE dnd_classes RENAME COLUMN armor_prof TO armor_proficiencies;
ALTER TABLE dnd_classes RENAME COLUMN saving_throw_profs TO saving_throws;

ALTER TABLE characters ADD COLUMN skills JSONB NOT NULL DEFAULT '{}';
ALTER TABLE characters ADD COLUMN saving_throws JSONB NOT NULL DEFAULT '{}';
ALTER TABLE characters DROP COLUMN IF EXISTS skill_profs;
