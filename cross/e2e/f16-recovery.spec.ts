import { test, expect, openDoc, panel, start, save, pdfInfo } from './helpers';

test.describe('F16 unsaved work is recovered', () => {
  test('F16-H1 an unsaved change is offered back after the app restarts, and restores as unsaved', async ({ page, errors }) => {
    await openDoc(page, 'report.pdf', 3);
    await panel(page, 'Organize');
    await page.getByRole('button', { name: 'Reverse page order' }).click();
    await expect(page.locator('.tab-name')).toHaveText('● report.pdf');
    await page.waitForTimeout(1800); // the draft is written shortly after the change
    await page.reload();
    const sheet = page.getByRole('dialog', { name: 'Restore unsaved changes?' });
    await expect(sheet).toContainText('report.pdf');
    await sheet.getByRole('button', { name: 'Restore' }).click();
    await expect(page.locator('.tab-name')).toHaveText('● report.pdf');
    const info = await pdfInfo((await save(page)).bytes);
    expect(info.pages.map((t) => t.match(/Report (\d)/)?.[1])).toEqual(['3', '2', '1']);
    // Saved: nothing to offer next time.
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'MK PDF' })).toBeVisible();
    await expect(sheet).toHaveCount(0);
  });

  test('F16-E1 Discard forgets the draft', async ({ page, errors }) => {
    await openDoc(page, 'report.pdf', 3);
    await panel(page, 'Organize');
    await page.getByRole('button', { name: 'Reverse page order' }).click();
    await page.waitForTimeout(1800);
    await page.reload();
    const sheet = page.getByRole('dialog', { name: 'Restore unsaved changes?' });
    await sheet.getByRole('button', { name: 'Discard' }).click();
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'MK PDF' })).toBeVisible();
    await expect(sheet).toHaveCount(0);
  });

  test('F16-E2 a password-protected document is never kept as a draft', async ({ page, errors }) => {
    await openDoc(page, 'report.pdf', 3);
    await panel(page, 'Protect');
    await page.getByPlaceholder('Password', { exact: true }).fill('secret');
    await page.getByPlaceholder('Confirm password').fill('secret');
    await page.getByRole('button', { name: 'Apply protection' }).click();
    await expect(page.locator('.tab-name')).toHaveText('● report.pdf');
    await page.waitForTimeout(1800);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'MK PDF' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Restore unsaved changes?' })).toHaveCount(0);
  });

  test('F16-E3 an unchanged document leaves nothing to restore', async ({ page, errors }) => {
    await openDoc(page, 'report.pdf', 3);
    await page.waitForTimeout(1500);
    await page.reload();
    await start(page);
    await expect(page.getByRole('dialog', { name: 'Restore unsaved changes?' })).toHaveCount(0);
  });

  test('F16-H2 About shows the version, the privacy statement and the licences', async ({ page, errors }) => {
    await start(page);
    await page.getByRole('button', { name: 'About MK PDF' }).click();
    const about = page.getByRole('dialog', { name: 'About MK PDF' });
    await expect(about).toContainText(/MK PDF \d+\.\d+\.\d+/);
    await expect(about).toContainText("doesn't collect or send any data");
    await about.getByRole('button', { name: 'Open-source licences' }).click();
    await expect(about).toContainText('Apache License');
    await expect(about).toContainText('SIL Open Font License');
    await expect(about).toContainText('pdf-lib');
  });
});
