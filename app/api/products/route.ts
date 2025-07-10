import { NextResponse } from 'next/server'

// CommerceTools API credentials - these should be in environment variables
// Make sure to add these to your .env file
const CTP_PROJECT_KEY = process.env.CTP_PROJECT_KEY;
const CTP_CLIENT_ID = process.env.CTP_CLIENT_ID;
const CTP_CLIENT_SECRET = process.env.CTP_CLIENT_SECRET;
const CTP_AUTH_URL = process.env.CTP_AUTH_URL;
const CTP_API_URL = process.env.CTP_API_URL;
const CTP_SCOPES = process.env.CTP_SCOPES || 'view_products:flaconi-stage'

// Type definitions for CommerceTools responses
interface AuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface ProductProjection {
  id: string;
  key?: string;
  name: {
    [locale: string]: string;
  };
  description?: {
    [locale: string]: string;
  };
  slug: {
    [locale: string]: string;
  };
  categories?: Array<{
    id: string;
    key?: string;
    name?: {
      [locale: string]: string;
    };
  }>;
  categoryReferences?: Array<{
    id: string;
    typeId: string;
    obj?: {
      id: string;
      key?: string;
      slug?: {
        [locale: string]: string;
      };
    };
  }>;
  masterVariant: {
    id: number;
    key?: string;
    sku?: string;
    images?: Array<{
      url: string;
      dimensions: {
        w: number;
        h: number;
      };
    }>;
    prices?: Array<{
      value: {
        currencyCode: string;
        centAmount: number;
        fractionDigits: number;
      };
    }>;
    attributes?: Array<{
      name: string;
      value: any;
    }>;
  };
  variants?: Array<{
    id: number;
    key?: string;
    sku?: string;
    images?: Array<{
      url: string;
    }>;
    prices?: Array<{
      value: {
        currencyCode: string;
        centAmount: number;
        fractionDigits: number;
      };
    }>;
    attributes?: Array<{
      name: string;
      value: any;
    }>;
  }>;
}

interface ProductResponse {
  results: ProductProjection[];
  total: number;
  count: number;
  offset: number;
}

/**
 * Get CommerceTools auth token
 */
async function getAuthToken(): Promise<string> {
  try {
    if (!CTP_CLIENT_ID || !CTP_CLIENT_SECRET) {
      throw new Error('Missing CommerceTools credentials in environment variables')
    }
    
    const response = await fetch(`${CTP_AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CTP_CLIENT_ID}:${CTP_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'scope': CTP_SCOPES
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get auth token: ${error}`)
    }

    const data: AuthResponse = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting auth token:', error)
    throw error
  }
}

/**
 * Fetch products from CommerceTools
 */
async function fetchProducts(token: string, limit = 50, offset = 0): Promise<ProductResponse> {
  try {
    // Sort by name ascending and add any filter criteria if needed
    // Also expand the categories to get their data
    const url = `${CTP_API_URL}/${CTP_PROJECT_KEY}/product-projections?limit=${limit}&offset=${offset}&sort=name.en asc&expand=categories[*]`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch products: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * GET handler to fetch products
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get auth token
    const token = await getAuthToken()
    
    // Fetch products
    const products = await fetchProducts(token, limit, offset)
    
    // Transform products to simpler format with more data for URL construction
    const simplifiedProducts = products.results.map(product => {
      // Get variant info
      const masterVariant = product.masterVariant;
      
      // Find the urlPath attribute in the variant attributes
      const urlPathAttr = masterVariant.attributes?.find(attr => attr.name === 'urlPath');
      let urlPath = '';
      
      // If urlPath attribute exists, extract it properly based on its type
      if (urlPathAttr && urlPathAttr.value) {
        if (typeof urlPathAttr.value === 'string') {
          // It's already a string
          urlPath = urlPathAttr.value;
        } else if (typeof urlPathAttr.value === 'object' && urlPathAttr.value !== null) {
          // Try to get the German locale first, then English, then any available
          if ('de' in urlPathAttr.value) {
            urlPath = urlPathAttr.value.de;
          } else if ('en' in urlPathAttr.value) {
            urlPath = urlPathAttr.value.en;
          } else {
            // Try the first value in the object
            const firstValue = Object.values(urlPathAttr.value)[0];
            if (typeof firstValue === 'string') {
              urlPath = firstValue;
            }
          }
        }
      }
      
      // If we still don't have a urlPath, fallback to the slug
      if (!urlPath) {
        urlPath = `${product.slug?.en || Object.values(product.slug || {})[0] || ''}.html`;
      }
      
      // Make sure urlPath doesn't start with a slash
      if (urlPath.startsWith('/')) {
        urlPath = urlPath.substring(1);
      }
      
      // Ensure the final result is actually a string
      if (typeof urlPath !== 'string') {
        console.warn(`urlPath for product ${product.id} is not a string:`, urlPath);
        urlPath = `${product.slug?.en || Object.values(product.slug || {})[0] || ''}.html`;
      }
      
      // Function to translate Polish category paths to German
      const translatePath = (path: string): string => {
        // Polish to German category translations
        const translations: Record<string, string> = {
          'makijaz': 'make-up',
          'perfumy': 'parfum',
          'pielegnacja': 'pflege',
          'wlosy': 'haare'
        };
        
        // Split the path and translate the first segment (category)
        const segments = path.split('/');
        if (segments.length > 0 && translations[segments[0]]) {
          segments[0] = translations[segments[0]];
        }
        
        return segments.join('/');
      };
      
      // Translate the URL path from Polish to German
      const translatedPath = translatePath(urlPath);
      
      return {
        id: product.id,
        key: product.key,
        name: product.name?.en || Object.values(product.name || {})[0] || 'Unnamed Product',
        description: product.description?.en || Object.values(product.description || {})[0] || '',
        slug: product.slug?.en || Object.values(product.slug || {})[0] || '',
        image: product.masterVariant.images?.[0]?.url || null,
        price: product.masterVariant.prices?.[0]?.value,
        variantId: masterVariant.id,
        sku: masterVariant.sku,
        // Store original and translated paths
        urlPath: translatedPath,
        // Add variant parameter to the URL when available
        flaconiUrl: masterVariant.id ? `${translatedPath}?variant=${masterVariant.id}` : translatedPath
      };
    })

    return NextResponse.json({
      products: simplifiedProducts,
      total: products.total,
      count: products.count,
      offset: products.offset
    })
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}
