import { SKILLS_2014 } from '../../data/skills'
import { BACKGROUNDS_2014, getBackgroundDefinition } from '../../data/backgrounds'
import { getClassDefinition } from '../../rules'
import {
  getSkillSelectionLimits,
  reconcileSkillProficiencies,
  toggleClassSkill,
} from '../../rules/character/skillProficiencies'
import type { Character } from '../../types/character'

interface Props {
  character: Character
  onBackgroundChange: (backgroundId: string) => void
  onSkillsChange: (skillProficiencies: string[]) => void
  showBackgroundSelect?: boolean
}

export function SkillProficiencyPicker({
  character,
  onBackgroundChange,
  onSkillsChange,
  showBackgroundSelect = true,
}: Props) {
  const classDef = getClassDefinition(character.classId)
  const limits = getSkillSelectionLimits(character)
  const skills = reconcileSkillProficiencies(character)
  const selectedCount = skills.length
  const bgDef = getBackgroundDefinition(character.background)

  const setSkills = (next: string[]) => {
    onSkillsChange(reconcileSkillProficiencies({ ...character, skillProficiencies: next }))
  }

  return (
    <div className="skill-picker">
      {showBackgroundSelect && (
        <label className="field">
          Предыстория (2014)
          <select
            className="input"
            value={bgDef ? character.background : ''}
            onChange={(event) => {
              const background = event.target.value
              const nextChar = { ...character, background }
              onBackgroundChange(background)
              onSkillsChange(reconcileSkillProficiencies(nextChar))
            }}
          >
            <option value="">Своя / без бонусных навыков</option>
            {BACKGROUNDS_2014.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="muted small">
        Навыки: {selectedCount} / {limits.maxTotalSkills}
        {classDef
          ? ` · Класс ${classDef.name}: ${limits.classPicksUsed(skills)} / ${limits.classPickCount} из списка класса`
          : ''}
        {limits.grantedSkillIds.length > 0
          ? ` · Предыстория: ${limits.grantedSkillIds.length} фиксированных`
          : ''}
      </p>

      {limits.grantedSkillIds.length > 0 && (
        <div className="skills-edit" style={{ marginBottom: '0.75rem' }}>
          {limits.grantedSkillIds.map((id) => {
            const skill = SKILLS_2014.find((item) => item.id === id)
            return (
              <label key={id} className="check-row">
                <input type="checkbox" checked disabled readOnly />
                {skill?.name ?? id}
                <span className="muted small"> (предыстория)</span>
              </label>
            )
          })}
        </div>
      )}

      <h4 className="mini-title">Навыки класса</h4>
      {!classDef || limits.classOptionIds.length === 0 ? (
        <p className="muted small">Для этого класса выбор навыков не задан.</p>
      ) : (
        <div className="skills-edit">
          {limits.classOptionIds.map((id) => {
            const skill = SKILLS_2014.find((item) => item.id === id)
            const checked = skills.includes(id)
            const granted = limits.isGranted(id)
            const disabled = granted || (!checked && !limits.canToggleClassSkill(id, skills))
            return (
              <label key={id} className="check-row" title={granted ? 'Уже от предыстории' : undefined}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => setSkills(toggleClassSkill(skills, id, character))}
                />
                {skill?.name ?? id}
              </label>
            )
          })}
        </div>
      )}
      {limits.classPicksUsed(skills) >= limits.classPickCount && limits.classPickCount > 0 && (
        <p className="muted small">Достигнут лимит навыков класса. Снимите галочку, чтобы выбрать другой.</p>
      )}
    </div>
  )
}
