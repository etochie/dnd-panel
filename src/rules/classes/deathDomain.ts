import type { DomainSpellEntry, SubclassDefinition } from './types'

export const DEATH_DOMAIN_SPELLS: DomainSpellEntry[] = [
  { characterLevel: 1, spellIds: ['false_life', 'ray_of_sickness'] },
  { characterLevel: 3, spellIds: ['blindness_deafness', 'ray_of_enfeeblement'] },
  { characterLevel: 5, spellIds: ['animate_dead', 'vampiric_touch'] },
  { characterLevel: 7, spellIds: ['blight', 'death_ward'] },
  { characterLevel: 9, spellIds: ['cloudkill', 'antilife_shell'] },
]

export const DEATH_DOMAIN: SubclassDefinition = {
  id: 'death_domain',
  classId: 'cleric',
  name: 'Домен Смерти',
  extraWeaponProficiencies: ['martial'],
  domainSpells: DEATH_DOMAIN_SPELLS,
  features: [
    {
      id: 'death_reaper',
      name: 'Жнец',
      level: 1,
      description:
        'Владение военным оружием. При накладывании некоторых заклинаний урона можно нанести урон цели в 1,5 м от цели заклинания (механика домена 2014).',
      usage: 'При накладывании подходящего заклинания.',
      actionType: 'часть накладывания заклинания',
      limits: 'См. полное описание домена в правилах 2014.',
    },
    {
      id: 'death_channel',
      name: 'Божественный канал: Касание смерти',
      level: 2,
      description:
        'При попадании рукопашной атакой можно потратить Божественный канал для дополнительного некротического урона (механика домена 2014).',
      usage: 'Божественный канал, при попадании рукопашной атакой.',
      actionType: 'без отдельного действия',
      limits: 'Один раз за использование Божественного канала.',
      resourceId: 'channel_divinity',
    },
    {
      id: 'death_inescapable',
      name: 'Неотвратимое разрушение',
      level: 6,
      description:
        'Урон некротическим заклинанием или Божественным каналом игнорирует сопротивление некротическому урону (механика домена 2014).',
      usage: 'Пассивно при подходящем уроне.',
      actionType: 'пассивно',
      limits: 'С 6 уровня.',
    },
    {
      id: 'death_avatar',
      name: 'Улучшенный жнец',
      level: 8,
      description:
        'Заговор некротического урона получает дополнительную цель в 1,5 м (механика домена 2014).',
      usage: 'При накладывании подходящего заговора.',
      actionType: 'часть заклинания',
      limits: 'С 8 уровня.',
    },
    {
      id: 'death_master',
      name: 'Владыка смерти',
      level: 17,
      description:
        'Усиление некротических эффектов домена (механика домена 2014). Полный текст не загружен - см. правила 2014.',
      usage: 'По описанию способности.',
      actionType: 'зависит от эффекта',
      limits: 'С 17 уровня.',
    },
  ],
}

export function domainSpellIdsForLevel(level: number): string[] {
  return DEATH_DOMAIN_SPELLS.filter((entry) => entry.characterLevel <= level).flatMap(
    (entry) => entry.spellIds,
  )
}
