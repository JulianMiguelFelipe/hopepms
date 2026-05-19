import { supabase } from '../lib/supabaseClient'
import { makeStamp } from '../utils/stampHelper'

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user')
    .select('userId, username, lastName, firstName, user_type, record_status, stamp')
    .order('user_type')
  return { data, error }
}

export async function getUserRights(userId) {
  const { data, error } = await supabase
    .from('UserModule_Rights')
    .select('Right_ID, Right_value, Record_status, Stamp')
    .eq('userid', userId)
  return { data, error }
}

export async function getUserModules(userId) {
  const { data, error } = await supabase
    .from('user_module')
    .select('Module_ID, rights_value, record_status, stamp')
    .eq('userid', userId)
  return { data, error }
}

export async function updateUserInfo(userId, fields, username) {
  const { error } = await supabase
    .from('user')
    .update({ ...fields, stamp: makeStamp('EDITED', username) })
    .eq('userId', userId)
  return error
}

export async function activateUser(userId, username) {
  const { error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE', stamp: makeStamp('ACTIVATED', username) })
    .eq('userId', userId)
  return error
}

export async function deactivateUser(userId, username) {
  const { error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE', stamp: makeStamp('DEACTIVATED', username) })
    .eq('userId', userId)
  return error
}

export async function updateUserType(userId, newType, username) {
  const { error } = await supabase
    .from('user')
    .update({ user_type: newType, stamp: makeStamp('ROLE_CHANGED', username) })
    .eq('userId', userId)
  return error
}

export async function updateRight(userId, rightId, value, username) {
  const { error } = await supabase
    .from('UserModule_Rights')
    .update({ Right_value: value, Stamp: makeStamp('RIGHT_UPDATED', username) })
    .eq('userid', userId)
    .eq('Right_ID', rightId)
  return error
}