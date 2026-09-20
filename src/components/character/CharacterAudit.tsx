import type { ValidationIssue } from '../../rules/validation/validateCharacter'

export function CharacterAudit({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return <p className="muted">Несоответствий правилам не найдено.</p>
  }
  return (
    <ul className="audit-list">
      {issues.map((issue) => (
        <li key={issue.id} className={issue.severity === 'error' ? 'audit-error' : 'audit-info'}>
          {issue.severity === 'error' ? '⚠ ' : 'ℹ '}
          {issue.message}
        </li>
      ))}
    </ul>
  )
}
