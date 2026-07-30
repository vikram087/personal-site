export function LoadingScreen() {
  return (
    <div
      role="status"
      style={{
        position: 'fixed', inset: 0, display: 'grid', placeContent: 'center',
        background: 'var(--void)', zIndex: 40, textAlign: 'center',
      }}
    >
      <div>
        <div className="loading-diamond" />
        <p className="kicker loading-text">Establishing transmission…</p>
      </div>
    </div>
  )
}
