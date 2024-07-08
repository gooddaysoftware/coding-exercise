import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1 className="text-2xl m-5">Welcome to the GoodDay coding exercise!</h1>
      <span>
        <Link className="btn btn-outline" href="/parent-items">
          View Item Catalog
        </Link>
      </span>
      <span className="pl-10">
        <Link className="btn btn-outline" href="/purchase-orders">
          View My Purchase Orders
        </Link>
      </span>
    </main>
  );
}
