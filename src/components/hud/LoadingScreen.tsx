export function LoadingScreen() {
  return (
    <div
      role="status"
      style={{
        position: 'fixed', inset: 0, display: 'grid', placeContent: 'center',
        background: 'var(--void)', zIndex: 40,
      }}
    >
      <p className="kicker">Establishing transmission…</p>
    </div>
  )
}
