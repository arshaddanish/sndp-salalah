import Link from 'next/link';

export const metadata = {
  title: 'Transactions | SNDP Salalah',
  description: 'Transaction statement module is being rolled out in phases',
};
// TODO: implement transactions module
export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Transactions</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Statement list is being implemented in the next module. You can manage categories now.
        </p>
      </div>

      <div>
        <Link
          href="/transactions/categories"
          className="bg-accent hover:bg-accent-hover inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Manage Categories
        </Link>
      </div>
    </div>
  );
}
