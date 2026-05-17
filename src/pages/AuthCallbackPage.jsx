import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

async function provisionUser(user) {
  const username =
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email.split('@')[0]

const stamp = `REGISTERED ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`

  const { error: userError } = await supabase.from('user').upsert(
    {
      userId: user.id,
      username,
      firstName: user.user_metadata?.firstName || user.user_metadata?.full_name || username,
      lastName: user.user_metadata?.lastName || '',
      user_type: 'USER',
      record_status: 'INACTIVE',
      stamp,
    },
    { onConflict: 'userId', ignoreDuplicates: true }
  )

  if (userError) {
    console.error('provision user error:', JSON.stringify(userError))
    return
  }

  await supabase.from('user_module').upsert(
    [
      { userid: user.id, Module_ID: 'Prod_Mod',   rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
      { userid: user.id, Module_ID: 'Report_Mod', rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
      { userid: user.id, Module_ID: 'Adm_Mod',    rights_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
    ],
    { onConflict: 'userid,Module_ID', ignoreDuplicates: true }
  )

  await supabase.from('UserModule_Rights').upsert(
    [
      { userid: user.id, Right_ID: 'PRD_ADD',  Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: user.id, Right_ID: 'PRD_EDIT', Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: user.id, Right_ID: 'PRD_DEL',  Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: user.id, Right_ID: 'REP_001',  Right_value: 1, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: user.id, Right_ID: 'REP_002',  Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
      { userid: user.id, Right_ID: 'ADM_USER', Right_value: 0, Record_status: 'ACTIVE', Stamp: 'AUTO' },
    ],
    { onConflict: 'userid,Right_ID', ignoreDuplicates: true }
  )
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }

      const user = session.user

      const { data: existing } = await supabase
        .from('user')
        .select('record_status')
        .eq('userId', user.id)
        .maybeSingle()

      if (!existing) {
        await provisionUser(user)
        await supabase.auth.signOut()
        navigate('/login?error=not_activated')
        return
      }

      if (existing.record_status === 'ACTIVE') {
        navigate('/products')
      } else {
        await supabase.auth.signOut()
        navigate('/login?error=not_activated')
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Signing you in...</p>
    </div>
  )
}
