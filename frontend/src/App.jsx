import { useState } from 'react'
import UploadPage from './components/UploadPage'
import Dashboard from './components/Dashboard'

export default function App() {
  const [data, setData] = useState(null)

  if (data) {
    return <Dashboard data={data} onReset={() => setData(null)} />
  }

  return <UploadPage onData={setData} />
}
