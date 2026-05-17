import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

async function provisionUser(authUser) {
  const username =
    authUser.user_metadata?.username ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email.split('@')[0]

  const stamp = `REGISTERED ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`

  const { error: userError } = await supabase.from('user').upsert(
    {
      userId:        authUser.id,
      username,
      firstName:     authUser.user_metadata?.firstName || authUser.user_metadata?.full_name || username,
      lastName:      authUser.user_metadata?.lastName || '',
      user_type:     'USER',
      record_status: 'INACTIVE',
      stamp,
    },
    { onConflict: 'userId', ignoreDuplicates: true }
  )

  if (userError) { console.error('Provision user error:', userError); return false }

  await supabase.from('user_module').upsert(
    [
      { userid: authUser.id, Module_ID: 'Prod_Mod',   rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
      { userid: authUser.id, Module_ID: 'Report_Mod', rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
      { userid: authUser.id, Module_ID: 'Adm_Mod',    rights_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
    ],
    { onConflict: 'userid,Module_ID', ignoreDuplicates: true }
  )

  await supabase.from('UserModule_Rights').upsert(
    [
      { userid: authUser.id, Right_ID: 'PRD_ADD',  Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: authUser.id, Right_ID: 'PRD_EDIT', Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: authUser.id, Right_ID: 'PRD_DEL',  Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: authUser.id, Right_ID: 'REP_001',  Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: authUser.id, Right_ID: 'REP_002',  Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: authUser.id, Right_ID: 'ADM_USER', Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
    ],
    { onConflict: 'userid,Right_ID', ignoreDuplicates: true }
  )

  return true
}

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

    if (error) {
      console.error('AuthContext user fetch error:', error)
      setCurrentUser(null)
      setLoading(false)
      return
    }

    // No row yet — provision it now (trigger failed, handle client-side)
    if (!userRow) {
      const ok = await provisionUser(session.user)
      if (ok) {
        await supabase.auth.signOut()
        setAuthError('Your account has been registered and is pending activation by an administrator.')
      } else {
        setAuthError('Account setup failed. Please contact an administrator.')
      }
      setCurrentUser(null)
      setLoading(false)
      return
    }

    if (userRow.record_status !== 'ACTIVE') {
      await supabase.auth.signOut()
      setAuthError('Your account is pending activation by an administrator.')
      setCurrentUser(null)
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session)
    })

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
