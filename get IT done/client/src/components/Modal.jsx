import { useEffect, useRef } from 'react'

export function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modalOverlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modalContent" ref={contentRef}>
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button type="button" className="modalClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">
          {children}
        </div>
      </div>
    </div>
  )
}
