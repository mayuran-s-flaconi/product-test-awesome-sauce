"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export interface ProductPrice {
  currencyCode: string
  centAmount: number
  fractionDigits: number
}

export interface Product {
  id: string
  name: string
  description: string
  image: string | null
  slug: string
  price?: ProductPrice
  variantId?: number
  sku?: string
  urlPath?: string
  flaconiUrl?: string
}

export interface ProductSelectorProps {
  onSelect: (product: Product | null) => void
  selectedProduct: Product | null
}

export interface ApiResponse {
  products: Product[]
  total: number
  count: number
  offset: number
}

export default function ProductSelector({ onSelect, selectedProduct }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch products")
        }

        const data: ApiResponse = await response.json()
        
        // Ensure products is always an array of valid Product objects
        if (Array.isArray(data.products)) {
          setProducts(data.products)
          
          if (data.products.length === 0) {
            setError("No products available.")
          }
        } else {
          setProducts([])
          setError("Invalid product data received.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleSelectProduct = (product: Product) => {
    onSelect(product)
  }

  const clearSelection = () => {
    onSelect(null)
  }

  // Format price to display
  const formatPrice = (price?: ProductPrice) => {
    if (!price) return null
    
    const amount = price.centAmount / Math.pow(10, price.fractionDigits)
    return new Intl.NumberFormat("en-US", {
      style: "currency", 
      currency: price.currencyCode
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error && !products.length) {
    return <div className="text-red-500 py-4">{error}</div>
  }

  if (selectedProduct) {
    return (
      <Card className="relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={clearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="p-4 flex items-center">
          {selectedProduct.image && (
            <div className="w-16 h-16 mr-4 relative flex-shrink-0">
              <Image
                src={selectedProduct.image}
                alt={selectedProduct.name}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div>
            <h3 className="font-medium">{selectedProduct.name}</h3>
            {selectedProduct.price && (
              <p className="text-sm text-gray-500">{formatPrice(selectedProduct.price)}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Select a product for this lottery:</h3>
      
      {products.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-lg">
          No products available
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
          {products.map((product) => {
              // Safely assert that product has an id property
              if (!product || typeof product !== 'object' || !('id' in product)) {
                return null;
              }
              
              const isSelected = selectedProduct && selectedProduct.id === product.id;
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`
                    border rounded-md p-3 cursor-pointer transition-all
                    ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-400'}
                  `}
                >
                  <div className="flex items-center h-full">
                    {product.image ? (
                      <div className="w-12 h-12 mr-3 relative flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 mr-3 bg-gray-100 flex items-center justify-center rounded flex-shrink-0">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                    <div className="flex-grow overflow-hidden">
                      <div className="font-medium truncate">{product.name}</div>
                      {product.price && (
                        <div className="text-sm text-gray-500">{formatPrice(product.price)}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  )
}
