import type { Party, Invoice } from './types';

/**
 * Calculate the current outstanding balance for a party based on:
 * - Opening outstanding (from party record)
 * - Total billed from invoices
 * - Total received payments
 */
export function calculatePartyOutstanding(
  party: Pick<Party, 'openingOutstanding'>,
  invoices: Pick<Invoice, 'total' | 'amountReceived'>[]
): number {
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + inv.amountReceived, 0);
  return party.openingOutstanding + totalBilled - totalReceived;
}

/**
 * Get all invoices for a specific party
 */
export function getPartyInvoices(
  invoices: Invoice[],
  partyId: string
): Invoice[] {
  return invoices.filter((inv) => inv.partyId === partyId);
}

/**
 * Calculate running balance for each invoice in chronological order
 * Returns an array with each invoice's running balance
 */
export function getRunningBalances(
  invoices: Invoice[],
  openingOutstanding: number
): Array<{ 
  invoice: Invoice; 
  runningBalance: number;
  cumulativeBilled: number;
  cumulativeReceived: number;
}> {
  // Sort by date (oldest first)
  const sortedInvoices = [...invoices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeBilled = 0;
  let cumulativeReceived = 0;

  return sortedInvoices.map((inv) => {
    cumulativeBilled += inv.total;
    cumulativeReceived += inv.amountReceived;
    const runningBalance = openingOutstanding + cumulativeBilled - cumulativeReceived;
    
    return {
      invoice: inv,
      runningBalance,
      cumulativeBilled,
      cumulativeReceived,
    };
  });
}