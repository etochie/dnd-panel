/** Перевод дистанций: 5 футов = 1,5 м (рус. PHB 2014) */
export function feetToMeters(feet: number): string {
  const meters = (feet / 5) * 1.5
  if (Number.isInteger(meters)) return `${meters} м`
  return `${meters.toFixed(1).replace('.', ',')} м`
}

export function formatRangeFeet(feet: number | null | undefined): string {
  if (feet == null) return 'нет достоверных данных 2014'
  return feetToMeters(feet)
}
