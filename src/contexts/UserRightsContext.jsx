import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const UserRightsContext = createContext({})

export function UserRightsProvider({ children }) {
  const { currentUser } = useAuth()
  const [rights, setRights] = useState({})

  useEffect(() => {
    if (!currentUser) {
      setRights({})
      return
    }

    const uid = currentUser.userId || currentUser.id
    if (!uid) return

    supabase
      .from('UserModule_Rights')
      .select('Right_ID, Right_value')
      .eq('userid', uid)
      .eq('Record_status', 'ACTIVE')
      .then(({ data, error }) => {
        if (error) { console.error('Rights load error:', error); return }
        const map = {}
        data?.forEach(r => { map[r.Right_ID] = r.Right_value })
        setRights(map)
      })
  }, [currentUser])

  return (
    <UserRightsContext.Provider value={rights}>
      {children}
    </UserRightsContext.Provider>
  )
}

export const useRights = () => useContext(UserRightsContext)
