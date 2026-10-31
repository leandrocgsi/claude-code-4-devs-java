import { Page, expect, test } from '@playwright/test';

const PRODUCT = 'Caneca Super Mario Coffee';
const OTHER_PRODUCT = 'Camiseta';
const TOKEN_KEY = 'geek-shopping-cart-token';
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function moneyOf(text: string | null): number {
  return Number((text ?? '').replace(/[^\d,]/g, '').replace(',', '.'));
}

function summaryRow(page: Page, label: string) {
  return page.locator('span').filter({ hasText: new RegExp(`^${label}$`) }).first().locator('xpath=..');
}

async function addFromProductPage(page: Page, name: string) {
  await page.goto(`/products?q=${encodeURIComponent(name)}`);
  await page.getByRole('link', { name: new RegExp(name) }).first().click();
  await expect(page).toHaveURL(/\/products\/\d+$/);
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByText('Added to your cart.').first()).toBeVisible();
}

test.describe('cart', () => {
  test('adding from the product page fills the badge and the cart page', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);

    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();
    await page.getByRole('link', { name: 'View cart' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();
    await expect(page.getByText('Cart Summary')).toBeVisible();
  });

  test('every cart request carries the same token and the browser keeps it', async ({ page }) => {
    const tokens: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/cart/')) tokens.push(request.headers()['x-cart-token'] ?? '');
    });

    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();

    expect(tokens.length).toBeGreaterThan(1);
    tokens.forEach((token) => expect(token).toMatch(TOKEN_PATTERN));
    expect(new Set(tokens).size).toBe(1);
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), TOKEN_KEY);
    expect(stored).toContain(tokens[0]);
  });

  test('the cart survives a reload', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();
    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();
  });

  test('adding the same product twice sums the quantity', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();

    await page.getByRole('button', { name: 'Add to Cart' }).click();

    await expect(page.getByRole('link', { name: '2 items in cart' })).toBeVisible();
    await page.goto('/cart');
    await expect(page.getByRole('row', { name: new RegExp(PRODUCT) })).toHaveCount(1);
  });

  test('the cart page changes the quantity and removes the line', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByRole('link', { name: '2 items in cart' })).toBeVisible();

    await page.getByRole('button', { name: 'Decrease quantity' }).click();
    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`^Remove ${PRODUCT}`) }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: '0 items in cart' })).toBeVisible();
  });

  test('the cart page clears every line at once', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await addFromProductPage(page, OTHER_PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();
    await expect(page.getByRole('cell', { name: new RegExp(OTHER_PRODUCT) }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Clear cart' }).click();

    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('adding from a card of the shop works too', async ({ page }) => {
    await page.goto(`/products?q=${encodeURIComponent(PRODUCT)}`);
    await expect(page.getByRole('link', { name: new RegExp(PRODUCT) }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Add to cart' }).first().click({ force: true });

    await expect(page.getByText('Added to your cart.').first()).toBeVisible();
    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();
  });

  test('a new visitor sees the empty cart and no summary', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
    await expect(page.getByText('Shipping', { exact: true })).toHaveCount(0);
  });

  test('the cart summary shows the shipping and a total that includes it', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();

    await expect(summaryRow(page, 'Shipping')).toContainText(/R\$\s*10,00/);
    const subtotal = moneyOf(await summaryRow(page, 'Subtotal').textContent());
    const shipping = moneyOf(await summaryRow(page, 'Shipping').textContent());
    const total = moneyOf(await summaryRow(page, 'Total').textContent());
    expect(shipping).toBe(10);
    expect(total).toBeCloseTo(subtotal + shipping, 2);
    await expect(page.getByPlaceholder('Coupon Code')).toHaveCount(0);
  });

  test('the checkout summary shows the same shipping and total', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();
    const cartTotal = moneyOf(await summaryRow(page, 'Total').textContent());

    await page.getByRole('link', { name: 'Proceed To Checkout' }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByText(new RegExp(`${PRODUCT} × 1`))).toBeVisible();
    await expect(summaryRow(page, 'Shipping')).toContainText(/R\$\s*10,00/);
    expect(moneyOf(await summaryRow(page, 'Total').textContent())).toBeCloseTo(cartTotal, 2);
  });

  test('changing the quantity keeps the shipping and moves the total', async ({ page }) => {
    await addFromProductPage(page, PRODUCT);
    await page.goto('/cart');
    await expect(page.getByRole('cell', { name: new RegExp(PRODUCT) })).toBeVisible();
    const before = moneyOf(await summaryRow(page, 'Total').textContent());

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByRole('link', { name: '2 items in cart' })).toBeVisible();

    await expect(summaryRow(page, 'Shipping')).toContainText(/R\$\s*10,00/);
    expect(moneyOf(await summaryRow(page, 'Total').textContent())).toBeGreaterThan(before);
  });

  test('two browsers keep separate carts', async ({ page, browser }) => {
    await addFromProductPage(page, PRODUCT);
    await expect(page.getByRole('link', { name: '1 items in cart' })).toBeVisible();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto('/cart');

    await expect(otherPage.getByText('Your cart is empty')).toBeVisible();
    await otherContext.close();
  });
});
