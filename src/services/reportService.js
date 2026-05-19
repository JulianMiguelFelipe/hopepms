import { supabase } from '../lib/supabaseClient'

export async function getProductReport() {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('prodCode, description, unit, unitPrice, effDate')
    .order('prodCode')
  return { data, error }
}

export async function getTopSelling() {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('prodCode, description, unit, totalQty')
  return { data, error }
}

export async function getPriceHistory(prodCode) {
  const { data, error } = await supabase
    .from('priceHist')
    .select('effDate, unitPrice')
    .eq('prodCode', prodCode)
    .order('effDate', { ascending: true })
  return { data, error }
}

export async function getAllPriceHistory() {
  const { data, error } = await supabase
    .from('priceHist')
    .select('prodCode, effDate, unitPrice')
    .order('effDate', { ascending: true })
  return { data, error }
}
