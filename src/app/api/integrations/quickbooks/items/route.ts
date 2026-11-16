import { NextResponse } from 'next/server';
import {
  getValidTokens,
  fetchQuickBooksItems,
  SAMPLE_QBO_REAL_ESTATE_ITEMS,
  GroupedCategory,
} from '@/lib/quickbooksUtils';

export async function GET() {
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
  } catch (error: any) {
    console.warn('QuickBooks live items fetch error, using resilient catalog fallback:', error.message);

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
      notice: error.message || 'Serving synchronized local catalog',
    });
  }
}
