import { NextResponse } from "next/server";
import { BUILTIN_VIRIONS } from "@/lib/pocketmine/virion-injector";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const builtinList = Object.values(BUILTIN_VIRIONS).map((v) => ({
      name: v.name,
      namespace: v.namespace,
      version: v.version,
      description: v.description,
      isBuiltin: true,
    }));

    const customVirions = await prisma.virionPackage.findMany({
      select: {
        name: true,
        namespace: true,
        version: true,
        description: true,
        sourceUrl: true,
      },
    });

    return NextResponse.json({
      virions: [...builtinList, ...customVirions],
    });
  } catch (error: any) {
    console.error("Virions list error:", error);
    return NextResponse.json({ error: "Failed to list virions" }, { status: 500 });
  }
}
