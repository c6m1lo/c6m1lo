import type { Metadata } from "next";

import AppleHealthImporter from "@/components/AppleHealthImporter";

export const metadata: Metadata = {
  title: "Apple Watch Health Import",
  description: "Import Apple Watch Ultra health data from Apple Health export.xml and download a JSON summary.",
};

export default function HealthPage() {
  return <AppleHealthImporter />;
}

