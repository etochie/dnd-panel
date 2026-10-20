import type { Character } from '../../types/character'
import type { DomainSpellEntry, SubclassDefinition } from './types'

/** Бонусный заговор Жнеца, если персонаж принадлежит Домену Смерти */
export function getReaperCantripId(
  character: Pick<Character, 'subclassId' | 'reaperCantripId'>,
): string | null {
  return character.subclassId === 'death_domain' ? character.reaperCantripId : null
}

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
        'Вы знаете один заговор некромантии на ваш выбор из любого списка заклинаний. Он не входит в число ваших известных заговоров жреца. Когда вы накладываете заговор некромантии, обычно нацеленный на одно существо, он может нацелиться на два существа в пределах дистанции, находящихся не дальше 1,5 м друг от друга.',
      usage: 'При накладывании заговора некромантии, нацеленного на одно существо.',
      actionType: 'часть накладывания заклинания',
      limits: 'Две цели должны находиться в пределах 1,5 м друг от друга.',
    },
    {
      id: 'death_channel',
      name: 'Божественный канал: Касание смерти',
      level: 2,
      description:
        'Умение Домена Смерти. Когда вы попадаете по существу рукопашной атакой оружием или безоружным ударом, вы можете потратить использование Божественного канала. Цель получает дополнительный урон некротической энергией, равный 5 + удвоенный уровень жреца.',
      usage: 'При попадании по существу рукопашной атакой оружием или безоружным ударом.',
      actionType: 'без отдельного действия',
      limits: 'Тратит одно использование Божественного канала.',
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
