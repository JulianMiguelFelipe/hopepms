import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [authError, setAuthError]     = useState(null)

  const resolveUser = async (session) => {
    if (!session) {
      setCurrentUser(null)
      setLoading(false)
      return
    }

    const authId = session.user.id

    const { data: userRow, error } = await supabase
      .from('user')
      .select('userId, record_status, user_type, username, lastName, firstName')
      .eq('userId', authId)
      .maybeSingle()

    if (error || !userRow) {
      setCurrentUser(null)
      setAuthError('Account not found or pending activation.')
      setLoading(false)
      return
    }

    if (userRow.record_status !== 'ACTIVE') {
      await supabase.auth.signOut()
      setCurrentUser(null)
      setAuthError('Your account is pending activation by an administrator.')
      setLoading(false)
      return
    }

    setAuthError(null)
    setCurrentUser({
      id:            authId,
      userId:        authId,
      email:         session.user.email,
      username:      userRow.username,
      lastName:      userRow.lastName,
      firstName:     userRow.firstName,
      user_type:     userRow.user_type,
      record_status: userRow.record_status,
    })
    setLoading(false)
  }

  useEffect(() => {
    // 1. Check existing session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session)
    })

    // 2. Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          resolveUser(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, authError, setAuthError, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
