import { LiFiWidget } from '@lifi/widget'
import './App.css'

const search = new URLSearchParams(window.location.search)
const toAddress = search.get('toAddress') || undefined

const widgetConfig = {
  appearance: 'dark',
  variant: 'wide',
  toAddress,
  theme: {
    container: {
      borderRadius: '16px',
      boxShadow: 'none',
    },
  },
}

function App() {
  return (
    <div className="widget-shell">
      <LiFiWidget integrator="KnurFi" config={widgetConfig} />
    </div>
  )
}

export default App
