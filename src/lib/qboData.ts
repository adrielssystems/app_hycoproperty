// ==============================================================================
//   HYCO Property Management — QuickBooks Online (QBO) Account Mappings
//   Extracted from Developer Requirements: Expense Mapping & CAM Recovery Logic
// ==============================================================================

export interface QBOAccountMappingDef {
  qbo_account_name: string;
  platform_category: string;
  default_recovery: 'Recoverable' | 'Lease-Specific' | 'Non-Recoverable';
  account_type?: string;
  description?: string;
}

export const OFFICIAL_QBO_ACCOUNT_MAPPINGS: QBOAccountMappingDef[] = [
  // 1. Utilities
  { qbo_account_name: 'Utilities', platform_category: 'Utilities', default_recovery: 'Recoverable', description: 'Electric, gas and water building service' },
  { qbo_account_name: 'Waste Disposal', platform_category: 'Utilities', default_recovery: 'Recoverable', description: 'Dumpster, trash hauling and recycling' },

  // 2. Grounds & Exterior
  { qbo_account_name: 'Landscaping', platform_category: 'Landscaping', default_recovery: 'Recoverable', description: 'Mowing, lawn care, exterior seasonal planting' },
  { qbo_account_name: 'Insurance', platform_category: 'Insurance', default_recovery: 'Recoverable', description: 'Commercial property & casualty building policy' },
  { qbo_account_name: 'Association Fees', platform_category: 'Association Fees', default_recovery: 'Recoverable', description: 'Business park or commercial condo association dues' },

  // 3. Property Taxes
  { qbo_account_name: 'Property Taxes', platform_category: 'Property Taxes', default_recovery: 'Recoverable', description: 'Marion County real estate taxes' },
  { qbo_account_name: 'Property Tax Penalties & Interest', platform_category: 'Property Taxes', default_recovery: 'Non-Recoverable', description: 'Late fees and penalties (Owner responsibility)' },

  // 4. Repairs & Maintenance (Recoverable)
  { qbo_account_name: 'Repair & Maintenance', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'General building repairs and contractor services' },
  { qbo_account_name: 'Repair & Maintenance:Appliances', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Common breakroom and building equipment' },
  { qbo_account_name: 'Repair & Maintenance:Paving Repair', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Asphalt patching, sealcoating, parking striping' },
  { qbo_account_name: 'Repair & Maintenance:HVAC Repair', platform_category: 'HVAC', default_recovery: 'Recoverable', description: 'Rooftop unit servicing, filters, seasonal inspection' },
  { qbo_account_name: 'Plumbing', platform_category: 'Plumbing', default_recovery: 'Recoverable', description: 'Common backflow testing, sewer, risers and plumbing' },
  { qbo_account_name: 'Maintenance', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Routine janitorial and preventative maintenance' },
  { qbo_account_name: 'Repairs', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'General structural and exterior repairs' },
  { qbo_account_name: 'Other Repairs', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Incidental minor common area repairs' },
  { qbo_account_name: 'Lock Replacement', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Exterior gate and master keyway re-keying' },
  { qbo_account_name: 'Key Duplicates - Suites', platform_category: 'Repairs & Maintenance', default_recovery: 'Recoverable', description: 'Keycard and physical key duplication' },
  { qbo_account_name: 'General Supplies', platform_category: 'Building Supplies', default_recovery: 'Recoverable', description: 'Salt for winter de-icing, lighting ballasts, bulbs' },

  // 5. Lease-Specific Categories
  { qbo_account_name: 'Repair & Maintenance:Roofing', platform_category: 'Roofing', default_recovery: 'Lease-Specific', description: 'Roof inspection and leak mitigation (Per contract)' },
  { qbo_account_name: 'Accounting Fee', platform_category: 'Professional Fees', default_recovery: 'Lease-Specific', description: 'Annual property audit and CAM cert preparation' },
  { qbo_account_name: 'Legal & Professional Fees', platform_category: 'Professional Fees', default_recovery: 'Lease-Specific', description: 'Legal counsel for building disputes or easements' },
  { qbo_account_name: 'Licenses & Permits', platform_category: 'Professional Fees', default_recovery: 'Lease-Specific', description: 'City operating permits and fire marshal inspection' },
  { qbo_account_name: 'Purchases', platform_category: 'Capital Expenditure', default_recovery: 'Lease-Specific', description: 'Equipment purchases with amortized lease recovery' },

  // 6. Non-Recoverable Administrative & Overhead (Landlord only)
  { qbo_account_name: 'Advertising & Marketing', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Suite leasing campaigns and commercial signs' },
  { qbo_account_name: 'Advertising', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Commercial listing promotion (LoopNet, Crexi)' },
  { qbo_account_name: 'Auto', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Property manager maintenance vehicle fuel/repairs' },
  { qbo_account_name: 'Auto and Travel', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Corporate travel expenses' },
  { qbo_account_name: 'Travel', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Corporate owner travel' },
  { qbo_account_name: 'Meals', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Executive dining and client meetings' },
  { qbo_account_name: 'Internet & Telephone', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Management office communications' },
  { qbo_account_name: 'SaaS', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Software subscriptions (Yardi, AppFolio, etc.)' },
  { qbo_account_name: 'Office Supplies/Expense', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Administrative office stationery and equipment' },
  { qbo_account_name: 'Postage', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Mailing of notices and statements' },
  { qbo_account_name: 'Bank Charges & Fees', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Wire fees, bank service charges' },
  { qbo_account_name: 'Recruiting', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Hiring expenses for management staff' },
  { qbo_account_name: 'Merchant Platform Fees', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Credit card processing overhead' },
  { qbo_account_name: 'Miscellaneous', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Unassigned general expenses' },
  { qbo_account_name: 'Other Expenses', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'General owner overhead' },
  { qbo_account_name: 'Taxes - State', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'State corporate income and franchise taxes' },
  { qbo_account_name: 'Taxes - Other', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Federal and local business entity taxes' },
  { qbo_account_name: 'Uncategorized Expense', platform_category: 'Administrative', default_recovery: 'Non-Recoverable', description: 'Default holding account before reconciliation' },

  // 7. Non-Recoverable Capital Expenditure
  { qbo_account_name: 'Remodeling', platform_category: 'Capital Expenditure', default_recovery: 'Non-Recoverable', description: 'Major building reconstruction or capital additions' },
  { qbo_account_name: 'Pilon Sign - Box Installation', platform_category: 'Capital Expenditure', default_recovery: 'Non-Recoverable', description: 'Highway pylon monument sign structural build' },
];

export interface SampleExpenseDef {
  property_id: number;
  qbo_account_name: string;
  vendor_name: string;
  amount: number;
  expense_date: string;
  fiscal_year: number;
  description: string;
  payment_method: string;
}

export const SAMPLE_INDIANAPOLIS_EXPENSES: SampleExpenseDef[] = [
  // 7898 Zionsville Rd Commercial Center (Property ID: 1)
  {
    property_id: 1,
    qbo_account_name: 'Utilities',
    vendor_name: 'AES Indiana',
    amount: 3420.50,
    expense_date: '2026-11-05',
    fiscal_year: 2026,
    description: 'Electric common parking lot & exterior security lighting',
    payment_method: 'ACH',
  },
  {
    property_id: 1,
    qbo_account_name: 'Waste Disposal',
    vendor_name: 'Republic Services of Indiana',
    amount: 1150.00,
    expense_date: '2026-11-10',
    fiscal_year: 2026,
    description: 'Commercial 8-yard dumpster service & recycling pickup',
    payment_method: 'ACH',
  },
  {
    property_id: 1,
    qbo_account_name: 'Landscaping',
    vendor_name: 'Hoosier Turf & Snow Pros',
    amount: 2200.00,
    expense_date: '2026-11-18',
    fiscal_year: 2026,
    description: 'Fall leaf cleanup, shrub pruning and winter prep',
    payment_method: 'Check',
  },
  {
    property_id: 1,
    qbo_account_name: 'Insurance',
    vendor_name: 'Travelers Commercial Casualty',
    amount: 6850.00,
    expense_date: '2026-10-15',
    fiscal_year: 2026,
    description: 'Annual commercial hazard & liability policy (Q4 installment)',
    payment_method: 'Wire',
  },
  {
    property_id: 1,
    qbo_account_name: 'Property Taxes',
    vendor_name: 'Marion County Treasurer',
    amount: 14200.00,
    expense_date: '2026-11-01',
    fiscal_year: 2026,
    description: '2026 Fall Real Property Tax Installment (Parcel 49-01-...)',
    payment_method: 'Wire',
  },
  {
    property_id: 1,
    qbo_account_name: 'Repair & Maintenance:HVAC Repair',
    vendor_name: 'Indy Air Solutions LLC',
    amount: 1850.00,
    expense_date: '2026-11-20',
    fiscal_year: 2026,
    description: 'Rooftop unit RTU-2 blower motor replacement and filter swap',
    payment_method: 'ACH',
  },
  {
    property_id: 1,
    qbo_account_name: 'Repair & Maintenance:Roofing',
    vendor_name: 'Indy Pro Roofing Services',
    amount: 3200.00,
    expense_date: '2026-10-28',
    fiscal_year: 2026,
    description: 'TPO membrane seam resealing around north HVAC curbs',
    payment_method: 'Check',
  },
  {
    property_id: 1,
    qbo_account_name: 'Advertising & Marketing',
    vendor_name: 'LoopNet / CoStar Group',
    amount: 950.00,
    expense_date: '2026-11-12',
    fiscal_year: 2026,
    description: 'Commercial digital listing for Suite 104 (Owner Expense)',
    payment_method: 'Credit Card',
  },

  // Park 100 Industrial Center (Property ID: 2)
  {
    property_id: 2,
    qbo_account_name: 'Utilities',
    vendor_name: 'Citizens Energy Group',
    amount: 2890.00,
    expense_date: '2026-11-04',
    fiscal_year: 2026,
    description: 'Gas heating baseline and industrial water utility',
    payment_method: 'ACH',
  },
  {
    property_id: 2,
    qbo_account_name: 'Repair & Maintenance:Paving Repair',
    vendor_name: 'Circle City Asphalt & Paving',
    amount: 4500.00,
    expense_date: '2026-09-15',
    fiscal_year: 2026,
    description: 'Truck court heavy asphalt patch and loading dock sealcoating',
    payment_method: 'Wire',
  },
  {
    property_id: 2,
    qbo_account_name: 'Property Taxes',
    vendor_name: 'Marion County Treasurer',
    amount: 19800.00,
    expense_date: '2026-11-01',
    fiscal_year: 2026,
    description: 'Fall property taxes Park 100 industrial tract',
    payment_method: 'Wire',
  },
  {
    property_id: 2,
    qbo_account_name: 'Insurance',
    vendor_name: 'Chubb Commercial Insurance',
    amount: 8900.00,
    expense_date: '2026-10-10',
    fiscal_year: 2026,
    description: 'Industrial property casualty and environmental coverage',
    payment_method: 'Wire',
  },

  // Morris Street Flex & Service Hub (Property ID: 3)
  {
    property_id: 3,
    qbo_account_name: 'Plumbing',
    vendor_name: 'Indy Pipe & Backflow Specialists',
    amount: 1200.00,
    expense_date: '2026-10-19',
    fiscal_year: 2026,
    description: 'Annual grease trap and exterior storm drain cleanout',
    payment_method: 'ACH',
  },
  {
    property_id: 3,
    qbo_account_name: 'General Supplies',
    vendor_name: 'Grainger Industrial Supply',
    amount: 680.00,
    expense_date: '2026-11-15',
    fiscal_year: 2026,
    description: 'Winter de-icing calcium chloride pallets and safety salt',
    payment_method: 'Credit Card',
  },
];

