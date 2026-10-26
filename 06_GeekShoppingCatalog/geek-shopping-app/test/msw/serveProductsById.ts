import { http, HttpResponse } from 'msw';
import { PRODUCTS_URL, ProductResponse } from '../fixtures';
import { server } from './server';

export function serveProductsById(products: ProductResponse[]) {
  const requested: number[] = [];
  server.use(
    http.get(`${PRODUCTS_URL}/:id`, ({ params }) => {
      const id = Number(params.id);
      requested.push(id);
      const found = products.find((product) => product.id === id);
      return found ? HttpResponse.json(found) : HttpResponse.json({ message: 'No records found for this ID!' }, { status: 404 });
    }),
  );
  return requested;
}
