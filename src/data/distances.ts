/** Перевод дистанций: 5 футов = 1,5 м (рус. PHB 2014) */
export function feetToMeters(feet: number): string {
  const meters = (feet / 5) * 1.5
  if (Number.isInteger(meters)) return `${meters} м`
  return `${meters.toFixed(1).replace('.', ',')} м`
}

/** Метры в футы: 1,5 м = 5 футов */
export function metersToFeet(meters: number): number {
  return Math.round((meters / 1.5) * 5)
}

/** Например "30 фт (9 м)": футы основные, метры в скобках */
export function formatFeetWithMeters(meters: number): string {
  const rounded = Number.isInteger(meters) ? String(meters) : meters.toFixed(1).replace('.', ',')
  return `${metersToFeet(meters)} фт (${rounded} м)`
}

export function formatRangeFeet(feet: number | null | undefined): string {
  if (feet == null) return 'нет достоверных данных 2014'
  return feetToMeters(feet)
}
