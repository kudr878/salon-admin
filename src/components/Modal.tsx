import type { ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
  /** Блокировать закрытие (фон и крестик), пока идёт сохранение */
  preventClose?: boolean
  /** Доп. класс для `.modal-box` (например `modal-box--wide`) */
  boxClassName?: string
}

export default function Modal({
  title,
  children,
  onClose,
  preventClose,
  boxClassName,
}: ModalProps) {
  function backdropClick() {
    if (preventClose) {
      return
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={backdropClick}>
      <div
        className={boxClassName ? `modal-box ${boxClassName}` : 'modal-box'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-x"
            onClick={onClose}
            disabled={preventClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
