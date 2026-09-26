const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}
