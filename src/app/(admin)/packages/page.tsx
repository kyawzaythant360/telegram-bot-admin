import type { Metadata } from "next";
import { Gem } from "lucide-react";

import { AddPackageForm, PackageRow } from "@/components/package-editor";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listPackages } from "@/lib/queries";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesPage() {
  await requireAdmin();
  const packages = await listPackages();

  return (
    <>
      <PageHeader
        title="Packages & prices"
        description="Changes are live in the bot immediately. Orders already placed keep their original price."
      />

      <Card title={`Packages shown to customers (${packages.length})`} bodyClassName="p-0 sm:p-0">
        {packages.length === 0 ? (
          <EmptyState icon={Gem} title="No packages">
            Customers can&apos;t order until you add at least one package below.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {packages.map((pkg, i) => (
              <PackageRow
                key={pkg.key}
                pkg={pkg}
                isFirst={i === 0}
                isLast={i === packages.length - 1}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Add a package" className="mt-4">
        <AddPackageForm />
      </Card>
    </>
  );
}
