import { Routes, Route } from 'react-router-dom'
import './App.css'
import InquiryView from './Components/InquiryView'
import ReportView from './Components/ReportView'

function App() {
  return (
    <Routes>
      <Route path="/inquiry/:id" element={<InquiryView />} />
      <Route path="/report/:id" element={<ReportView />} />
    </Routes>
  )
}

export default App
