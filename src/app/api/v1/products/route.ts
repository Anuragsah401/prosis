import { NextRequest, NextResponse } from "next/server";
import { ProductRegistry, ProductManifest } from "@/packages/sdk";

// Ensure all first-party products are initialized in registry
import "@/packages/products/seatbooking";
import "@/packages/products/workforce";
import "@/packages/products/marketing";
import "@/packages/products/menu";
import "@/packages/products/analytics";

export async function GET() {
  try {
    const products = ProductRegistry.getAll();
    const active = ProductRegistry.getActive();

    return NextResponse.json({
      success: true,
      count: products.length,
      activeCount: active.length,
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const manifest: ProductManifest = await req.json();

    if (!manifest.id || !manifest.name || !manifest.slug) {
      return NextResponse.json(
        { success: false, error: "id, name, and slug are required" },
        { status: 400 }
      );
    }

    ProductRegistry.register(manifest);

    return NextResponse.json({
      success: true,
      message: `Product ${manifest.name} registered successfully`,
      data: manifest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register product" },
      { status: 500 }
    );
  }
}

