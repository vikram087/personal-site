function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function LoadingScreen({ progress, done = false }: { progress?: number; done?: boolean }) {
  return (
    <div role="status" className={`loading-screen${done ? ' is-done' : ''}`}>
      <div>
        <div className="loading-diamond" />
        <p className="kicker loading-text">
          Establishing transmission…
          {progress !== undefined && ` ${clampProgress(progress)}%`}
        </p>
      </div>
    </div>
  )
}
