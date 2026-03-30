import { useEffect, useMemo } from 'react'
import {
  SALON_HOUR_FIRST,
  SALON_HOUR_LAST,
  getBookedHoursForMaster,
  salonHourOptions,
} from '../utils/salonCalendar'

type AppointmentLike = {
  id: number
  masterId: number
  scheduledAt: string
  status: string
}

type AppointmentSlotFieldsProps = {
  dateStr: string
  setDateStr: (v: string) => void
  hour: string
  setHour: (v: string) => void
  masterId: string
  appointments: AppointmentLike[]
  excludeAppointmentId?: number
}

export default function AppointmentSlotFields({
  dateStr,
  setDateStr,
  hour,
  setHour,
  masterId,
  appointments,
  excludeAppointmentId,
}: AppointmentSlotFieldsProps) {
  const masterNum = masterId ? Number(masterId) : NaN
  const booked = useMemo(() => {
    if (!masterId || Number.isNaN(masterNum) || !dateStr) {
      return new Set<number>()
    }
    return getBookedHoursForMaster(
      appointments,
      masterNum,
      dateStr,
      excludeAppointmentId,
    )
  }, [appointments, masterId, masterNum, dateStr, excludeAppointmentId])

  useEffect(() => {
    if (hour === '') {
      return
    }
    if (booked.has(Number(hour))) {
      setHour('')
    }
  }, [booked, hour, setHour])

  const slotDisabled = !masterId

  return (
    <div className="form-slot-fields">
      <label>
        Дата
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          required
          disabled={slotDisabled}
        />
      </label>
      <label>
        Час ({SALON_HOUR_FIRST}:00–{SALON_HOUR_LAST}:00)
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          required
          disabled={slotDisabled || !dateStr}
        >
          <option value="">— Выберите час —</option>
          {salonHourOptions().map((h) => (
            <option key={h} value={String(h)} disabled={booked.has(h)}>
              {h}:00{booked.has(h) ? ' — занято' : ''}
            </option>
          ))}
        </select>
      </label>
      {slotDisabled && (
        <p className="form-hint">Сначала выберите мастера, чтобы видеть свободные часы.</p>
      )}
    </div>
  )
}
