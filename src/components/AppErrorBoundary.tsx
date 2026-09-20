import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  message: string | null
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { message: null }

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || 'Неизвестная ошибка' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.message) return this.props.children
    return (
      <div className="card" style={{ margin: '1rem' }}>
        <h2 className="section-title">Приложение не загрузилось</h2>
        <p>{this.state.message}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Обновить страницу
        </button>
      </div>
    )
  }
}
