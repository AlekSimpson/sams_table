-- +goose Up
CREATE TABLE dnd_classes (
    key                     TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    hit_die                 INT NOT NULL,
    saving_throws           TEXT[] NOT NULL DEFAULT '{}',
    primary_ability         TEXT[] NOT NULL DEFAULT '{}',
    spellcasting_ability    TEXT,
    armor_proficiencies     TEXT[] NOT NULL DEFAULT '{}',
    weapon_proficiencies    TEXT[] NOT NULL DEFAULT '{}',
    num_skill_proficiencies INT NOT NULL DEFAULT 2
);

CREATE TABLE dnd_races (
    key          TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    stat_bonuses JSONB NOT NULL DEFAULT '{}',
    size         TEXT NOT NULL,
    base_speed   INT NOT NULL,
    traits       TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE dnd_subraces (
    key          TEXT NOT NULL,
    race_key     TEXT NOT NULL REFERENCES dnd_races(key) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    stat_bonuses JSONB NOT NULL DEFAULT '{}',
    traits       TEXT[] NOT NULL DEFAULT '{}',
    PRIMARY KEY (key, race_key)
);

-- Seed classes
INSERT INTO dnd_classes (key, name, hit_die, saving_throws, primary_ability, spellcasting_ability, armor_proficiencies, weapon_proficiencies, num_skill_proficiencies) VALUES
    ('barbarian', 'Barbarian', 12, '{str,con}', '{str}',     NULL,  '{Light,Medium,Shields}',        '{Simple,Martial}',                                                   2),
    ('bard',      'Bard',       8, '{dex,cha}', '{cha}',     'cha', '{Light}',                       '{Simple,"Hand Crossbows",Longswords,Rapiers,Shortswords}',            3),
    ('cleric',    'Cleric',     8, '{wis,cha}', '{wis}',     'wis', '{Light,Medium,Shields}',        '{Simple}',                                                            2),
    ('druid',     'Druid',      8, '{int,wis}', '{wis}',     'wis', '{Light,Medium,"Shields"}', '{Clubs,Daggers,Darts,Javelins,Maces,Quarterstaffs,Scimitars,Sickles,Slings,Spears}', 2),
    ('fighter',   'Fighter',   10, '{str,con}', '{str,dex}', NULL,  '{Light,Medium,Heavy,Shields}',         '{Simple,Martial}',                                                   2),
    ('monk',      'Monk',       8, '{str,dex}', '{dex,wis}', NULL,  '{}',                            '{Simple,Shortswords}',                                                2),
    ('paladin',   'Paladin',   10, '{wis,cha}', '{str,cha}', 'cha', '{Light,Medium,Heavy,Shields}',         '{Simple,Martial}',                                                   2),
    ('ranger',    'Ranger',    10, '{str,dex}', '{dex,wis}', 'wis', '{Light,Medium,Shields}',        '{Simple,Martial}',                                                   3),
    ('rogue',     'Rogue',      8, '{dex,int}', '{dex}',     NULL,  '{Light}',                       '{Simple,"Hand Crossbows",Longswords,Rapiers,Shortswords}',            4),
    ('sorcerer',  'Sorcerer',   6, '{con,cha}', '{cha}',     'cha', '{}',                            '{Daggers,Darts,Slings,Quarterstaffs,"Light Crossbows"}',              2),
    ('warlock',   'Warlock',    8, '{wis,cha}', '{cha}',     'cha', '{Light}',                       '{Simple}',                                                            2),
    ('wizard',    'Wizard',     6, '{int,wis}', '{int}',     'int', '{}',                            '{Daggers,Darts,Slings,Quarterstaffs,"Light Crossbows"}',              2),
    ('artificer', 'Artificer',  8, '{con,int}', '{int}',     'int', '{Light,Medium,Shields}',        '{Simple}',                                                            2);

-- Seed races
INSERT INTO dnd_races (key, name, stat_bonuses, size, base_speed, traits) VALUES
    ('human',      'Human',      '{"str":1,"dex":1,"con":1,"int":1,"wis":1,"cha":1}', 'Medium', 30, '{"Extra Language"}'),
    ('elf',        'Elf',        '{"dex":2}',                                          'Medium', 30, '{"Darkvision 60ft","Keen Senses (Perception proficiency)","Fey Ancestry","Trance"}'),
    ('dwarf',      'Dwarf',      '{"con":2}',                                          'Medium', 25, '{"Darkvision 60ft","Dwarven Resilience (poison adv + resistance)","Dwarven Combat Training","Stonecunning"}'),
    ('halfling',   'Halfling',   '{"dex":2}',                                          'Small',  25, '{"Lucky (reroll 1s on d20)","Brave (adv vs frightened)","Halfling Nimbleness"}'),
    ('half_elf',   'Half-Elf',   '{"cha":2}',                                          'Medium', 30, '{"Darkvision 60ft","Fey Ancestry","Skill Versatility (2 skill proficiencies)","+1 to two ability scores of player choice"}'),
    ('half_orc',   'Half-Orc',   '{"str":2,"con":1}',                                  'Medium', 30, '{"Darkvision 60ft","Menacing (Intimidation proficiency)","Relentless Endurance","Savage Attacks"}'),
    ('gnome',      'Gnome',      '{"int":2}',                                           'Small',  25, '{"Darkvision 60ft","Gnome Cunning (adv INT/WIS/CHA saves vs magic)"}'),
    ('dragonborn', 'Dragonborn', '{"str":2,"cha":1}',                                  'Medium', 30, '{"Draconic Ancestry (choose dragon type)","Breath Weapon","Damage Resistance (ancestry type)"}'),
    ('tiefling',   'Tiefling',   '{"int":1,"cha":2}',                                  'Medium', 30, '{"Darkvision 60ft","Hellish Resistance (fire resistance)","Infernal Legacy (Thaumaturgy, Hellish Rebuke, Darkness)"}');

-- Seed subraces
INSERT INTO dnd_subraces (key, race_key, name, stat_bonuses, traits) VALUES
    ('high_elf',       'elf',      'High Elf',           '{"int":1}', '{"Elf Weapon Training","Cantrip (Wizard list)","Extra Language"}'),
    ('wood_elf',       'elf',      'Wood Elf',           '{"wis":1}', '{"Elf Weapon Training","Fleet of Foot (speed 35ft)","Mask of the Wild"}'),
    ('drow',           'elf',      'Drow (Dark Elf)',    '{"cha":1}', '{"Superior Darkvision 120ft","Sunlight Sensitivity","Drow Magic","Drow Weapon Training"}'),
    ('hill_dwarf',     'dwarf',    'Hill Dwarf',         '{"wis":1}', '{"Dwarven Toughness (+1 max HP per level)"}'),
    ('mountain_dwarf', 'dwarf',    'Mountain Dwarf',     '{"str":2}', '{"Dwarven Armor Training (light & medium)"}'),
    ('lightfoot',      'halfling', 'Lightfoot Halfling', '{"cha":1}', '{"Naturally Stealthy"}'),
    ('stout',          'halfling', 'Stout Halfling',     '{"con":1}', '{"Stout Resilience (adv vs poison + resistance)"}'),
    ('forest_gnome',   'gnome',    'Forest Gnome',       '{"dex":1}', '{"Natural Illusionist (Minor Illusion cantrip)","Speak with Small Beasts"}'),
    ('rock_gnome',     'gnome',    'Rock Gnome',         '{"con":1}', '{\"Artificer''s Lore (+2 History on magic/alchemical/tech objects)\",Tinker}');

-- +goose Down
DROP TABLE IF EXISTS dnd_subraces;
DROP TABLE IF EXISTS dnd_races;
DROP TABLE IF EXISTS dnd_classes;
