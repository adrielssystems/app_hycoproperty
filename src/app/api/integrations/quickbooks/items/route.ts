import { NextResponse } from 'next/server';
import {
  getValidTokens,
  fetchQuickBooksItems,
  SAMPLE_QBO_REAL_ESTATE_ITEMS,
  GroupedCategory,
  verifyQuickBooksAccess,
} from '@/lib/quickbooksUtils';

export async function GET() {
  const { authenticated, authorized } = await verifyQuickBooksAccess([
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE',
  ]);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  try {
    const tokens = await getValidTokens();
    const { groupedCategories, rawItems } = await fetchQuickBooksItems(tokens);

    return NextResponse.json({
      success: true,
      items: groupedCategories,
      rawItems,
      total: rawItems.length,
      source: 'live',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serving synchronized local catalog';
    console.warn('QuickBooks live items fetch error, using resilient catalog fallback:', message);

    // Group sample items by default Real Estate categories
    const fallbackCategories: GroupedCategory[] = [
      {
        categoryId: 'cat-commercial-revenue',
        categoryName: 'Commercial Real Estate Services & Rent',
        items: SAMPLE_QBO_REAL_ESTATE_ITEMS.filter((i) => i.Type === 'Service'),
      },
      {
        categoryId: 'cat-escrow-liabilities',
        categoryName: 'Escrow Deposits & Liabilities',
        items: SAMPLE_QBO_REAL_ESTATE_ITEMS.filter((i) => i.Type === 'NonInventory'),
      },
    ];

    return NextResponse.json({
      success: true,
      items: fallbackCategories,
      rawItems: SAMPLE_QBO_REAL_ESTATE_ITEMS,
      total: SAMPLE_QBO_REAL_ESTATE_ITEMS.length,
      source: 'sample',
      notice: message,
    });
  }
}
