import { expect, test } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('catalog', () => {
  test('home shows the categories, the featured and the recent products from the API', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Caneca/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Caneca Super Mario Coffee' }).first()).toBeVisible();
  });

  test('a sold out product is listed, marked and cannot be added to the cart', async ({ page }) => {
    await page.goto('/products?q=Capacete');

    await expect(page.getByRole('link', { name: /Capacete Darth Vader/ })).toBeVisible();
    await expect(page.getByText('Out of stock').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Out of stock' }).first()).toBeDisabled();
  });

  test('home to product to cart', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Caneca Super Mario Coffee' }).first().click();

    await expect(page).toHaveURL(/\/products\/\d+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Caneca Super Mario Coffee' })).toBeVisible();
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.getByText('Added to your cart.')).toBeVisible();

    await page.getByRole('link', { name: 'View cart' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('Caneca Super Mario Coffee')).toBeVisible();
  });

  test('an unknown product shows the not found state', async ({ page }) => {
    await page.goto('/products/999999');

    await expect(page.getByText('Product not found')).toBeVisible();
  });

  test('shop filters, sorts and paginates on the server with everything in the url', async ({ page }) => {
    await page.goto('/products');

    await page.getByLabel(/^Camiseta/).check();
    await expect(page).toHaveURL(/category=Camiseta/);
    await expect(page.getByRole('link', { name: /Camiseta/ }).first()).toBeVisible();

    await page.locator('#product-sort').selectOption('rating:desc');
    await expect(page).toHaveURL(/sortBy=rating/);

    await page.locator('#product-size').selectOption('24');
    await expect(page).toHaveURL(/size=24/);
    await expect(page).not.toHaveURL(/page=/);
  });

  test('header search and category menu use the API', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search for products').fill('Linux');
    await page.getByPlaceholder('Search for products').press('Enter');
    await expect(page).toHaveURL(/\/products\?q=Linux/);
    await expect(page.getByRole('link', { name: /GNU Linux/ })).toBeVisible();

    await page.getByRole('button', { name: /Categories/ }).click();
    await page.getByRole('link', { name: 'Livro', exact: true }).click();
    await expect(page).toHaveURL(/category=Livro/);
  });
});

test.describe('admin', () => {
  test('creates a product with an image, sees it listed, edits it and deletes it', async ({ page, request }) => {
    const name = `E2E Poster ${Date.now()}`;

    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: 'Manage products' })).toBeVisible();

    await page.getByRole('button', { name: 'New product' }).click();
    const dialog = page.getByRole('dialog', { name: 'New product' });
    await dialog.getByLabel('Name', { exact: true }).fill(name);
    await dialog.getByLabel('Description').fill('Created by the end-to-end test');
    await dialog.getByLabel('Price', { exact: true }).fill('19.9');
    await dialog.getByLabel('Category').fill('E2E');
    await dialog.getByLabel('Quantity in stock').fill('3');
    await dialog.getByLabel('Product image', { exact: true }).setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PNG_1X1 });
    await expect(dialog.getByRole('button', { name: 'Crop image' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Create product' }).click();

    await expect(page.getByText('Product created.')).toBeVisible();
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await expect(row.getByRole('img', { name })).toHaveAttribute('src', /\/api\/product\/v1\/\d+\/image$/);

    await row.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit product' });
    await editDialog.getByLabel('Quantity in stock').fill('0');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Product updated.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(name) }).getByText('Out of stock')).toBeVisible();

    await page.getByRole('row', { name: new RegExp(name) }).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog', { name: 'Delete product' }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Product deleted.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(name) })).toHaveCount(0);

    const search = await request.get(`${API_URL}/api/product/v1`, { params: { q: name } });
    expect((await search.json()).page.totalElements).toBe(0);
  });

  test('shows the errors by field when the form is invalid and rejects a file that is not an image', async ({ page }) => {
    await page.goto('/admin/products');
    await page.getByRole('button', { name: 'New product' }).click();
    const dialog = page.getByRole('dialog', { name: 'New product' });

    await dialog.getByLabel('Product image', { exact: true }).setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7') });
    await expect(dialog.getByText('Use a JPEG, PNG, WebP or GIF image.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Create product' }).click();
    await expect(dialog.getByText('The name is required.')).toBeVisible();
    await expect(dialog.getByText('The price must be greater than zero.')).toBeVisible();
    await expect(dialog.getByText('The category is required.')).toBeVisible();
  });
});
