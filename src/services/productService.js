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

export async function addProduct(product, userId) {
  const { error } = await supabase
    .from('product')
    .insert({
      prodCode:      product.prodCode,
      description:   product.description,
      unit:          product.unit,
      record_status: 'ACTIVE',
      stamp:         makeStamp('ADDED', userId),
    })
  return error
}

export async function updateProduct(prodCode, fields, userId) {
  const { error } = await supabase
    .from('product')
    .update({ ...fields, stamp: makeStamp('EDITED', userId) })
    .eq('prodCode', prodCode)
  return error
}

export async function softDeleteProduct(prodCode, userId) {
  const { error } = await supabase
    .from('product')
    .update({ record_status: 'INACTIVE', stamp: makeStamp('DEACTIVATED', userId) })
    .eq('prodCode', prodCode)
  return error
}

export async function recoverProduct(prodCode, userId) {
  const { error } = await supabase
    .from('product')
    .update({ record_status: 'ACTIVE', stamp: makeStamp('REACTIVATED', userId) })
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

export async function addPriceEntry(prodCode, effDate, unitPrice, userId) {
  const { error } = await supabase
    .from('priceHist')
    .insert({
      prodCode,
      effDate,
      unitPrice,
      stamp: makeStamp('ADDED', userId),
    })
  return error
}

export async function getCurrentPrices() {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('prodCode, unitPrice, effDate')
  return { data, error }
}
