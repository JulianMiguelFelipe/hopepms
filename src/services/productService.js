import { supabase } from '../lib/supabaseClient'
import { makeStamp } from '../utils/stampHelper'

export async function getProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('prodCode, description, unit, record_status, stamp, updated_at')
    .eq('record_status', 'ACTIVE')
    .order('prodCode')
  return { data, error }
}

export async function getDeletedProducts() {
  const { data, error } = await supabase
    .from('product')
    .select('prodCode, description, unit, stamp, updated_at')
    .eq('record_status', 'INACTIVE')
    .order('prodCode')
  return { data, error }
}

export async function addProduct(product, username) {
  const { error } = await supabase
    .from('product')
    .insert({
      prodCode:      product.prodCode,
      description:   product.description,
      unit:          product.unit,
      record_status: 'ACTIVE',
      stamp:         makeStamp('ADDED', username),
    })
  return error
}

export async function updateProduct(prodCode, fields, username) {
  const { error } = await supabase
    .from('product')
    .update({ ...fields, stamp: makeStamp('EDITED', username) })
    .eq('prodCode', prodCode)
  return error
}

export async function softDeleteProduct(prodCode, username) {
  const { error } = await supabase
    .from('product')
    .update({ record_status: 'INACTIVE', stamp: makeStamp('DEACTIVATED', username) })
    .eq('prodCode', prodCode)
  return error
}

export async function recoverProduct(prodCode, username) {
  const { error } = await supabase
    .from('product')
    .update({ record_status: 'ACTIVE', stamp: makeStamp('REACTIVATED', username) })
    .eq('prodCode', prodCode)
  return error
}

export async function getPriceHistory(prodCode) {
  const { data, error } = await supabase
    .from('priceHist')
    .select('effDate, unitPrice, stamp')
    .eq('prodCode', prodCode)
    .order('effDate', { ascending: false })
  return { data, error }
}

export async function addPriceEntry(prodCode, effDate, unitPrice, username) {
  const { error } = await supabase
    .from('priceHist')
    .insert({
      prodCode,
      effDate,
      unitPrice,
      stamp: makeStamp('ADDED', username),
    })
  return error
}

export async function getCurrentPrices() {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('prodCode, unitPrice, effDate')
  return { data, error }
}