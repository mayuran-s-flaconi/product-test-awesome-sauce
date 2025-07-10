"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

type Product = {
  id: string
  name: string
  description: string
  image: string | null
  slug: string
  price?: {
    currencyCode: string
    centAmount: number
    fractionDigits: number
  }
}

interface ProductSearchProps {
  onSelect: (product: Product | null) => void
  selectedProduct: Product | null
}

export default function ProductSearch({ onSelect, selectedProduct }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setShowResults(true)

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
      
      if (data.products.length === 0) {
        setError("No products found. Try different search terms.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search products")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelectProduct = (product: Product) => {
    onSelect(product)
    setShowResults(false)
  }

  const clearSelection = () => {
    onSelect(null)
  }

  // Format price to display
  const formatPrice = (price?: { currencyCode: string; centAmount: number; fractionDigits: number }) => {
    if (!price) return null
    
    const amount = price.centAmount / Math.pow(10, price.fractionDigits)
    return new Intl.NumberFormat("en-US", {
      style: "currency", 
      currency: price.currencyCode
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {!selectedProduct ? (
        <>
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <Input
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !searchTerm.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {showResults && (
            <div className="mt-4 max-h-64 overflow-y-auto border rounded-lg">
              {products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {loading ? "Searching..." : "No products found"}
                </div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                      onClick={() => handleSelectProduct(product)}
                    >
                      {product.image && (
                        <div className="w-12 h-12 mr-3 relative flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <div className="font-medium">{product.name}</div>
                        {product.price && (
                          <div className="text-sm text-gray-500">{formatPrice(product.price)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
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
      )}
    </div>
  )
}
