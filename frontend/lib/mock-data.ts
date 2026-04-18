export interface FoodListing {
  id: string
  name: string
  quantity: string
  location: string
  address: string
  donorName: string
  donorType: string
  description: string
  expiryTime: Date | string
  imageUrl?: string
  status: 'available' | 'claimed' | 'expired'
  latitude: number
  longitude: number
  pickupWindow?: string
  category?: string
}

// NYC Area coordinates for realistic distribution
export const mockListings: FoodListing[] = [
  {
    id: '1',
    name: 'Fresh Bakery Items',
    quantity: '50 items',
    location: 'Downtown Bakery',
    address: '123 Main St, Manhattan',
    donorName: 'Downtown Bakery Co.',
    donorType: 'Bakery',
    description: 'Fresh bread, croissants, and pastries from today&apos;s batch',
    expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    status: 'available',
    latitude: 40.7128,
    longitude: -74.0060,
    pickupWindow: '4:00 PM - 6:00 PM',
    category: 'Bakery',
  },
  {
    id: '2',
    name: 'Organic Vegetables',
    quantity: '30 kg',
    location: 'Green Market',
    address: '456 Park Ave, Manhattan',
    donorName: 'Green Market NYC',
    donorType: 'Grocery',
    description: 'Seasonal organic vegetables including broccoli, carrots, and spinach',
    expiryTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    status: 'available',
    latitude: 40.7505,
    longitude: -73.9972,
    pickupWindow: '3:00 PM - 8:00 PM',
    category: 'Produce',
  },
  {
    id: '3',
    name: 'Restaurant Surplus',
    quantity: '15 meals',
    location: 'Italian Restaurant',
    address: '789 Broadway, Manhattan',
    donorName: 'Bella Restaurant',
    donorType: 'Restaurant',
    description: 'Prepared meals and ingredients from lunch service',
    expiryTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours
    status: 'available',
    latitude: 40.7489,
    longitude: -73.9680,
    pickupWindow: '4:00 PM - 9:00 PM',
    category: 'Prepared Food',
  },
  {
    id: '4',
    name: 'Dairy Products',
    quantity: '40 units',
    location: 'Local Dairy',
    address: '321 Madison Ave, Manhattan',
    donorName: 'Fresh Dairy Farm',
    donorType: 'Dairy',
    description: 'Milk, yogurt, and cheese approaching expiration',
    expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    status: 'available',
    latitude: 40.7614,
    longitude: -73.9776,
    pickupWindow: '2:00 PM - 7:00 PM',
    category: 'Dairy',
  },
  {
    id: '5',
    name: 'Protein Box',
    quantity: '25 boxes',
    location: 'Fitness Center Cafe',
    address: '654 5th Ave, Manhattan',
    donorName: 'FitFood Cafe',
    donorType: 'Cafe',
    description: 'Pre-packaged protein boxes with chicken, rice, and vegetables',
    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    status: 'available',
    latitude: 40.7549,
    longitude: -73.9840,
    pickupWindow: '5:00 PM - 7:00 PM',
    category: 'Prepared Food',
  },
  {
    id: '6',
    name: 'Canned Goods',
    quantity: '100 cans',
    location: 'Warehouse Store',
    address: '987 Broadway, Brooklyn',
    donorName: 'Bulk Warehouse',
    donorType: 'Wholesale',
    description: 'Assorted canned vegetables, fruits, and beans',
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    status: 'available',
    latitude: 40.6782,
    longitude: -73.9442,
    pickupWindow: 'Anytime',
    category: 'Shelf-Stable',
  },
  {
    id: '7',
    name: 'Fresh Fruit',
    quantity: '60 lbs',
    location: 'Farmers Market',
    address: '111 Market St, Brooklyn',
    donorName: 'Local Farmers',
    donorType: 'Farm',
    description: 'Apples, bananas, oranges from morning delivery',
    expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    status: 'available',
    latitude: 40.6892,
    longitude: -73.9760,
    pickupWindow: '2:00 PM - 5:00 PM',
    category: 'Produce',
  },
  {
    id: '8',
    name: 'Catering Leftovers',
    quantity: '35 servings',
    location: 'Event Space',
    address: '222 Park Pl, Manhattan',
    donorName: 'Premier Catering',
    donorType: 'Catering',
    description: 'Leftover catering from corporate event',
    expiryTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours
    status: 'available',
    latitude: 40.7135,
    longitude: -74.0066,
    pickupWindow: '4:00 PM - 5:30 PM',
    category: 'Prepared Food',
  },
]

export function getListingById(id: string): FoodListing | undefined {
  return mockListings.find((listing) => listing.id === id)
}

export function getListingsByStatus(status: 'available' | 'claimed' | 'expired'): FoodListing[] {
  return mockListings.filter((listing) => listing.status === status)
}

export function getListingsByCategory(category: string): FoodListing[] {
  return mockListings.filter((listing) => listing.category === category)
}
