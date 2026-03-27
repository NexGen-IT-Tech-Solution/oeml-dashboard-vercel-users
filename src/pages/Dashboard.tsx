import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Clock, ExternalLink } from 'lucide-react'
import oemlLogo from '@/assets/logos/OEML.png'
import opvtLogo from '@/assets/logos/OPVT.png'
import asalLogo from '@/assets/logos/ASAL.png'
import pipesizeLogo from '@/assets/logos/pipesize.png'
import nexgenLogo from '@/assets/logos/metabase.png'

interface UserStats {
  total: number
  active: number
  paused: number
  deactivated: number
  outside: number
  internal: number
}

interface TimeZone {
  name: string
  offset: number
}

interface Portal {
  id: string
  name: string
  url: string
}

const logoMap: { [key: string]: string } = {
  '1': oemlLogo,
  '2': opvtLogo,
  '3': asalLogo,
  '4': pipesizeLogo,
  '5': nexgenLogo,
}

const defaultPortals: Portal[] = [
  { id: '1', name: 'OEML', url: 'https://nexerp.oeml.ae' },
  { id: '2', name: 'OPVT', url: 'https://nexerp.opvt.ae' },
  { id: '3', name: 'ASAL', url: 'https://nexerp.alasayel.om' },
  { id: '4', name: 'Pipe Size', url: 'https://oemldxb-my.sharepoint.com/:b:/g/personal/itsupport_oeml_ae/IQBtVVNoDk7BSYdG63oTHEabAUJ4OoNQmsRBJ1a5TD0mLsc?e=eihZlK' },
  { id: '5', name: 'NexGen BI', url: 'https://nexbi.oeml.ae' },
]

const timeZones: TimeZone[] = [
  { name: 'UAE (Dubai)', offset: 4 },
  { name: 'UAE (Abu Dhabi)', offset: 4 },
  { name: 'Oman (Muscat)', offset: 4 },
]

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<{ email?: string; user_metadata?: { full_name?: string; role?: string } } | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, active: 0, paused: 0, deactivated: 0, outside: 0, internal: 0 })
  const [loading, setLoading] = useState(true)
  const [clocks, setClocks] = useState<{ [key: string]: { time: string; date: string } }>({})
  const [portals] = useState<Portal[]>(defaultPortals)

  useEffect(() => {
    const updateClocks = () => {
      const newClocks: { [key: string]: { time: string; date: string } } = {}
      const now = new Date()
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      timeZones.forEach((tz, idx) => {
        const localTime = new Date(utc + 3600000 * tz.offset)
        newClocks[idx] = {
          time: localTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
          date: localTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        }
      })
      setClocks(newClocks)
    }
    updateClocks()
    const interval = setInterval(updateClocks, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        const { data: profiles } = await supabase.from('profiles').select('*').limit(1000)

        if (profiles && profiles.length > 0) {
          setUserStats({
            total: profiles.length,
            active: profiles.filter((p: any) => p.status === 'active').length,
            paused: profiles.filter((p: any) => p.status === 'paused').length,
            deactivated: profiles.filter((p: any) => p.status === 'deactivated').length,
            outside: profiles.filter((p: any) => p.type === 'outside').length,
            internal: profiles.filter((p: any) => p.type === 'internal').length,
          })
        } else {
          setUserStats({ total: 1, active: 1, paused: 0, deactivated: 0, outside: 0, internal: 1 })
        }
      } catch (err: any) {
        console.error(err)
        setUserStats({ total: 1, active: 1, paused: 0, deactivated: 0, outside: 0, internal: 1 })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" /></div>
  }

  const userCards = [
    { title: 'Total Users', value: userStats.total, color: 'text-white', bg: 'bg-neutral-700' },
    { title: 'Active', value: userStats.active, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    { title: 'Paused', value: userStats.paused, color: 'text-amber-400', bg: 'bg-amber-400/20' },
    { title: 'Deactivated', value: userStats.deactivated, color: 'text-red-400', bg: 'bg-red-400/20' },
    { title: 'Outside', value: userStats.outside, color: 'text-blue-400', bg: 'bg-blue-400/20' },
    { title: 'Internal', value: userStats.internal, color: 'text-purple-400', bg: 'bg-purple-400/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-neutral-400 text-sm mt-1">Welcome back, {currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User'}!</p>
        <p className="text-neutral-500 text-xs mt-1">Role: <span className="text-emerald-400 capitalize">{currentUser?.user_metadata?.role || 'User'}</span></p>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {timeZones.map((tz, idx) => (
          <div key={idx} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-neutral-300">{tz.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-400/10">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{clocks[idx]?.time || '--:--:--'}</p>
                <p className="text-neutral-500 text-xs">{clocks[idx]?.date || ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {portals.map((portal) => (
          <a key={portal.id} href={portal.url} target="_blank" rel="noopener noreferrer" className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-lg flex items-center justify-between hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center p-2 overflow-hidden">
                <img src={logoMap[portal.id]} alt={portal.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{portal.name}</p>
                <p className="text-neutral-400 text-sm">Click to open portal</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10"><ExternalLink className="w-6 h-6 text-emerald-400" /></div>
          </a>
        ))}
      </div>
    </div>
  )
}