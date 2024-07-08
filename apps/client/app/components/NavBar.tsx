import Link from 'next/link';
import React from 'react';

const NavBar = () => {
  return (
    <div className="navbar bg-base-300 bg-accent-content/5 mt-2 mb-4 rounded-md">
      <Link href="/" className="btn btn-ghost normal-case text-xl">
        Home
      </Link>
      <Link href="/parent-items" className="btn btn-ghost normal-case text-xl">
        Item Catalog
      </Link>
      <Link
        href="/purchase-orders"
        className="btn btn-ghost normal-case text-xl"
      >
        Purchase Orders
      </Link>
    </div>
  );
};

export default NavBar;
