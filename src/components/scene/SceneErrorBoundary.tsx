'use client'
import { Component, type ReactNode } from 'react'

type Props = { fallback: ReactNode; children: ReactNode }
type State = { failed: boolean }

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.error('Scene crashed, falling back to index UI:', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
