export const SALON_HOUR_FIRST = 9
export const SALON_HOUR_LAST = 19

type Appt = {
  id: number
  masterId: number
  scheduledAt: string
  status: string
}

export function salonHourOptions(): number[] {
  const out: number[] = []
  for (let h = SALON_HOUR_FIRST; h <= SALON_HOUR_LAST; h += 1) {
    out.push(h)
  }
  return out
}

export function todayDateInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateHourToIsoLocal(dateStr: string, hour: number): string {
  const parts = dateStr.split('-').map(Number)
  const y = parts[0]
  const mon = parts[1]
  const day = parts[2]
  const d = new Date(y, mon - 1, day, hour, 0, 0, 0)
  return d.toISOString()
}

export function parseAppointmentSlot(iso: string): { dateStr: string; hour: string } {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${day}`
  const hour = String(d.getHours())
  return { dateStr, hour }
}

export function getBookedHoursForMaster(
  appointments: Appt[],
  masterId: number,
  dateStr: string,
  excludeAppointmentId?: number,
): Set<number> {
  const booked = new Set<number>()
  const parts = dateStr.split('-').map(Number)
  const y = parts[0]
  const mon = parts[1]
  const day = parts[2]
  for (const a of appointments) {
    if (excludeAppointmentId !== undefined && a.id === excludeAppointmentId) {
      continue
    }
    if (a.masterId !== masterId) {
      continue
    }
    if (a.status === 'CANCELLED') {
      continue
    }
    const d = new Date(a.scheduledAt)
    if (
      d.getFullYear() === y &&
      d.getMonth() + 1 === mon &&
      d.getDate() === day
    ) {
      booked.add(d.getHours())
    }
  }
  return booked
}
