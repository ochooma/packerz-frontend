import type { Metadata } from "next";
import { BoxEngineWorkspace } from "@/src/components/box-engine/BoxEngineWorkspace";

export const metadata: Metadata = {
  title: "BOX-RTE-001 | Packerz Box Engine",
  description:
    "Internal prototype for the Packerz BOX-RTE-001 Reverse Tuck End dieline.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BoxEnginePage() {
  return <BoxEngineWorkspace />;
}
