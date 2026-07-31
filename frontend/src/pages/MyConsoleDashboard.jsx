import MyConsoleNav from '../components/MyConsoleNav'
import MyActivityDashboard from '../components/MyActivityDashboard'

export default function MyConsoleDashboard() {
  return (
    <div className="container py-10">
      <MyConsoleNav />
      <MyActivityDashboard />
    </div>
  )
}
