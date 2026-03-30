import { useEffect, useState } from 'react'
import { apiJson, downloadExcel } from '../api/client'
import type { AdminRole } from '../api/auth'
import './Tables.css'

type Master = { id: number; fullName: string }

type ReportsPageProps = {
  role: AdminRole | null
}

export default function ReportsPage({ role }: ReportsPageProps) {
  const [masters, setMasters] = useState<Master[]>([])

  const [scheduleMasterId, setScheduleMasterId] = useState('')
  const [scheduleDay, setScheduleDay] = useState('')

  const [detailMasterId, setDetailMasterId] = useState('')
  const [detailFrom, setDetailFrom] = useState('')
  const [detailTo, setDetailTo] = useState('')

  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')

  const [workloadFrom, setWorkloadFrom] = useState('')
  const [workloadTo, setWorkloadTo] = useState('')

  const [volumesFrom, setVolumesFrom] = useState('')
  const [volumesTo, setVolumesTo] = useState('')

  useEffect(() => {
    apiJson<Master[]>('/api/admin/masters')
      .then(setMasters)
      .catch(() => {})
    const t = new Date()
    const iso = t.toISOString().slice(0, 10)
    setScheduleDay(iso)
    setDetailFrom(iso)
    setDetailTo(iso)
    setPeriodFrom(iso)
    setPeriodTo(iso)
    setWorkloadFrom(iso)
    setWorkloadTo(iso)
    setVolumesFrom(iso)
    setVolumesTo(iso)
  }, [])

  const isDirector = role === 'DIRECTOR'

  function qSchedule() {
    if (!scheduleMasterId || !scheduleDay) {
      return
    }
    const qs = new URLSearchParams({
      masterId: scheduleMasterId,
      date: scheduleDay,
    })
    downloadExcel(`/api/admin/reports/schedule?${qs}`, `schedule_${scheduleMasterId}.xlsx`)
  }

  function qMasterServices() {
    if (!detailMasterId || !detailFrom || !detailTo) {
      return
    }
    const qs = new URLSearchParams({
      masterId: detailMasterId,
      from: detailFrom,
      to: detailTo,
    })
    downloadExcel(`/api/admin/reports/master-services?${qs}`, `master_services.xlsx`)
  }

  function qPeriod() {
    if (!periodFrom || !periodTo) {
      return
    }
    const qs = new URLSearchParams({ from: periodFrom, to: periodTo })
    downloadExcel(`/api/admin/reports/services-period?${qs}`, `period.xlsx`)
  }

  function qWorkload() {
    if (!workloadFrom || !workloadTo) {
      return
    }
    const qs = new URLSearchParams({ from: workloadFrom, to: workloadTo })
    downloadExcel(`/api/admin/reports/master-workload?${qs}`, `workload.xlsx`)
  }

  function qVolumes() {
    if (!volumesFrom || !volumesTo) {
      return
    }
    const qs = new URLSearchParams({ from: volumesFrom, to: volumesTo })
    downloadExcel(`/api/admin/reports/service-volumes?${qs}`, `volumes.xlsx`)
  }

  return (
    <div className="page">
      <h2 className="page-title">Отчёты (Excel)</h2>
  

      <div className="reports-block">
        <h3>Занятость специалиста на дату</h3>
        <div className="reports-row">
          <label>
            Мастер
            <select
              value={scheduleMasterId}
              onChange={(e) => setScheduleMasterId(e.target.value)}
            >
              <option value="">—</option>
              {masters.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дата
            <input
              type="date"
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
            />
          </label>
          <button type="button" className="btn-primary" onClick={qSchedule}>
            Скачать Excel
          </button>
        </div>
      </div>

      <div className="reports-block">
        <h3>Сведения об оказании услуг мастером за период</h3>
        <div className="reports-row">
          <label>
            Мастер
            <select
              value={detailMasterId}
              onChange={(e) => setDetailMasterId(e.target.value)}
            >
              <option value="">—</option>
              {masters.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            С даты
            <input
              type="date"
              value={detailFrom}
              onChange={(e) => setDetailFrom(e.target.value)}
            />
          </label>
          <label>
            По дату
            <input
              type="date"
              value={detailTo}
              onChange={(e) => setDetailTo(e.target.value)}
            />
          </label>
          <button type="button" className="btn-primary" onClick={qMasterServices}>
            Скачать Excel
          </button>
        </div>
      </div>

      {isDirector && (
        <>
          <div className="reports-block">
            <h3>Услуги за период (сводная, сумма по всем услугам)</h3>
            <div className="reports-row">
              <label>
                С даты
                <input
                  type="date"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                />
              </label>
              <label>
                По дату
                <input
                  type="date"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                />
              </label>
              <button type="button" className="btn-primary" onClick={qPeriod}>
                Скачать Excel
              </button>
            </div>
          </div>

          <div className="reports-block">
            <h3>Объём работ мастеров за период</h3>
            <div className="reports-row">
              <label>
                С даты
                <input
                  type="date"
                  value={workloadFrom}
                  onChange={(e) => setWorkloadFrom(e.target.value)}
                />
              </label>
              <label>
                По дату
                <input
                  type="date"
                  value={workloadTo}
                  onChange={(e) => setWorkloadTo(e.target.value)}
                />
              </label>
              <button type="button" className="btn-primary" onClick={qWorkload}>
                Скачать Excel
              </button>
            </div>
          </div>

          <div className="reports-block">
            <h3>Объёмы по видам услуг за период</h3>
            <div className="reports-row">
              <label>
                С даты
                <input
                  type="date"
                  value={volumesFrom}
                  onChange={(e) => setVolumesFrom(e.target.value)}
                />
              </label>
              <label>
                По дату
                <input
                  type="date"
                  value={volumesTo}
                  onChange={(e) => setVolumesTo(e.target.value)}
                />
              </label>
              <button type="button" className="btn-primary" onClick={qVolumes}>
                Скачать Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
