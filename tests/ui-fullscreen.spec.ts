import { test, expect } from '@playwright/test';

test.describe('UI Fullscreen Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    await page.waitForSelector('body', { timeout: 15000 });
  });

  test('Dashboard in fullscreen - check layout issues', async ({ page }) => {
    const dashboard = await page.locator('text=Dashboard');
    await expect(dashboard).toBeVisible();
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('Dashboard - Horizontal scroll:', hasHorizontalScroll);
    
    const kpiCards = await page.locator('div.bg-white.rounded-xl, div.rounded-xl.border');
    const cardCount = await kpiCards.count();
    console.log('Dashboard KPI cards:', cardCount);
    
    const table = await page.locator('table');
    const tableVisible = await table.isVisible();
    console.log('Table visible:', tableVisible);
  });

  test('Items page in fullscreen - table issues', async ({ page }) => {
    await page.goto('http://localhost:5173/items');
    
    const tableHeaders = await page.locator('th');
    const headerCount = await tableHeaders.count();
    console.log('Table headers:', headerCount);
    
    const table = await page.locator('table');
    const tableWidth = await table.evaluate(el => el.getBoundingClientRect().width);
    console.log('Table width in fullscreen:', tableWidth);
    
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('Items page - Horizontal scroll:', hasHorizontalScroll);
  });

  test('Invoices page in fullscreen - check table layout', async ({ page }) => {
    await page.goto('http://localhost:5173/invoices');
    
    const headers = await page.locator('th');
    for (let i = 0; i < await headers.count(); i++) {
      const header = headers.nth(i);
      const text = await header.textContent();
      const width = await header.evaluate(el => el.getBoundingClientRect().width);
      console.log('Header', i, ':', text?.trim(), 'width:', width);
    }
    
    const rows = await page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log('Invoice rows:', rowCount);
  });

  test('InvoiceView in fullscreen - check card layout', async ({ page }) => {
    await page.goto('http://localhost:5173/invoices');
    
    const firstInvoice = await page.locator('tr td a');
    if (await firstInvoice.count() > 0) {
      await firstInvoice.first().click();
      await page.waitForTimeout(1000);
      
      const cards = await page.locator('.card, [class*="rounded-xl"]');
      const cardCount = await cards.count();
      console.log('InvoiceView cards:', cardCount);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log('InvoiceView - Horizontal scroll:', hasHorizontalScroll);
    }
  });

  test('ItemModal fullscreen issues - image preview', async ({ page }) => {
    await page.goto('http://localhost:5173/items');
    
    const addBtn = await page.locator('button:has-text("Add Item")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      const dialog = await page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        const dialogWidth = await dialog.evaluate(el => el.getBoundingClientRect().width);
        const dialogHeight = await dialog.evaluate(el => el.getBoundingClientRect().height);
        console.log('Dialog dimensions:', dialogWidth, 'x', dialogHeight);
        
        const imageContainer = await page.locator('[class*="aspect-square"]');
        if (await imageContainer.isVisible()) {
          const containerWidth = await imageContainer.evaluate(el => el.getBoundingClientRect().width);
          console.log('Image container width:', containerWidth);
        }
      }
    }
  });

  test('Sidebar in fullscreen mode', async ({ page }) => {
    const sidebar = await page.locator('div.fixed.left-0, div[class*="sidebar"]');
    const sidebarVisible = await sidebar.isVisible();
    console.log('Sidebar visible:', sidebarVisible);
    
    if (sidebarVisible) {
      const sidebarWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      console.log('Sidebar width:', sidebarWidth);
      
      const sidebarHeight = await sidebar.evaluate(el => el.getBoundingClientRect().height);
      console.log('Sidebar height:', sidebarHeight);
    }
  });

  test('Header in fullscreen mode', async ({ page }) => {
    const header = await page.locator('header');
    const headerVisible = await header.isVisible();
    console.log('Header visible:', headerVisible);
    
    if (headerVisible) {
      const headerHeight = await header.evaluate(el => el.getBoundingClientRect().height);
      console.log('Header height:', headerHeight);
    }
  });

  test('Check for z-index issues in fullscreen', async ({ page }) => {
    const elements = await page.locator('header, .sidebar, .fixed, [role="dialog"]');
    for (let i = 0; i < await elements.count(); i++) {
      const el = elements.nth(i);
      if (await el.isVisible()) {
        const zIndex = await el.evaluate(node => window.getComputedStyle(node as HTMLElement).zIndex);
        const position = await el.evaluate(node => window.getComputedStyle(node as HTMLElement).position);
        console.log('Element', i, 'position:', position, 'z-index:', zIndex);
      }
    }
  });

  test('Reports page fullscreen check', async ({ page }) => {
    await page.goto('http://localhost:5173/reports');
    
    const cards = await page.locator('.card, [class*="rounded-xl"]');
    const cardCount = await cards.count();
    console.log('Reports cards:', cardCount);
    
    const firstCard = cards.first();
    if (await firstCard.isVisible()) {
      const cardWidth = await firstCard.evaluate(el => el.getBoundingClientRect().width);
      const cardHeight = await firstCard.evaluate(el => el.getBoundingClientRect().height);
      console.log('First card dimensions:', cardWidth, 'x', cardHeight);
    }
  });
});
