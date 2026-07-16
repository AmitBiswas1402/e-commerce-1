export interface ProductReview {
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  reviews: ProductReview[];
  badge?: string;
  inStock: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description:
      "Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 8 microphones, exceptional sound quality with Integrated Processor V1.",
    category: "Electronics",
    price: 24999,
    originalPrice: 34990,
    rating: 4.7,
    reviewCount: 18423,
    badge: "Best Seller",
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524678714210-9917a6c619c2?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Rahul Sharma",
        avatar: "https://i.pravatar.cc/40?img=11",
        rating: 5,
        comment:
          "Absolutely worth every rupee! The noise cancellation is unreal. I can finally focus at the office.",
        date: "2026-06-18",
        verified: true,
      },
      {
        author: "Priya Menon",
        avatar: "https://i.pravatar.cc/40?img=5",
        rating: 4,
        comment:
          "Great sound, super comfortable for long hours. Battery life is amazing — lasted 28 hours.",
        date: "2026-06-02",
        verified: true,
      },
      {
        author: "Ankit Verma",
        avatar: "https://i.pravatar.cc/40?img=15",
        rating: 5,
        comment:
          "Premium build quality and the app customization is brilliant. Highly recommend!",
        date: "2026-05-21",
        verified: false,
      },
    ],
  },
  {
    id: 2,
    name: "Men's Slim Fit Cotton Casual Shirt — Navy Blue",
    description:
      "100% premium cotton slim-fit shirt with a spread collar. Perfect for office, casual, and semi-formal occasions. Machine washable with a wrinkle-resistant finish.",
    category: "Fashion",
    price: 899,
    originalPrice: 1799,
    rating: 4.3,
    reviewCount: 5621,
    badge: "50% Off",
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Karthik Nair",
        avatar: "https://i.pravatar.cc/40?img=33",
        rating: 5,
        comment:
          "Great quality for the price! The fabric is soft and the fit is perfect. Ordered twice already.",
        date: "2026-07-01",
        verified: true,
      },
      {
        author: "Divya Rao",
        avatar: "https://i.pravatar.cc/40?img=9",
        rating: 4,
        comment:
          "Nice shirt, colour looks exactly like the photo. Slightly slim but does the job.",
        date: "2026-06-15",
        verified: true,
      },
    ],
  },
  {
    id: 3,
    name: "Stainless Steel 5-Piece Cookware Set with Glass Lids",
    description:
      "Tri-ply stainless steel cookware set with aluminium core for even heat distribution. Dishwasher safe, oven safe up to 260°C. Includes frying pan, saucepan, and stock pot.",
    category: "Kitchen",
    price: 3499,
    originalPrice: 5999,
    rating: 4.5,
    reviewCount: 3102,
    badge: "New",
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Sneha Kulkarni",
        avatar: "https://i.pravatar.cc/40?img=47",
        rating: 5,
        comment:
          "Amazing quality! Heats up evenly and clean-up is a breeze. Worth every penny.",
        date: "2026-07-05",
        verified: true,
      },
      {
        author: "Rohan Desai",
        avatar: "https://i.pravatar.cc/40?img=12",
        rating: 4,
        comment:
          "Solid construction, but the lids are a bit heavy. Overall a great buy.",
        date: "2026-06-22",
        verified: false,
      },
      {
        author: "Meera Iyer",
        avatar: "https://i.pravatar.cc/40?img=23",
        rating: 5,
        comment: "Replaced my entire cookware. Food tastes better now! No joke.",
        date: "2026-06-10",
        verified: true,
      },
    ],
  },
  {
    id: 4,
    name: "Trail Running Shoes — Lightweight All-Terrain Grip",
    description:
      "Ultra-lightweight trail running shoes with Vibram® outsole for superior grip on all terrains. Breathable mesh upper, cushioned midsole with responsive foam. Great for treks and runs.",
    category: "Sports and Outdoors",
    price: 2799,
    originalPrice: 4499,
    rating: 4.6,
    reviewCount: 8890,
    badge: "Top Rated",
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556048219-bb6978360b84?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Amit Joshi",
        avatar: "https://i.pravatar.cc/40?img=52",
        rating: 5,
        comment:
          "Best trail shoes under 3k! Used them for a 20km trek in Coorg. Zero blisters.",
        date: "2026-06-28",
        verified: true,
      },
      {
        author: "Pooja Bhatt",
        avatar: "https://i.pravatar.cc/40?img=44",
        rating: 4,
        comment:
          "Very comfortable for daily runs. Grip is excellent on wet roads too.",
        date: "2026-06-14",
        verified: true,
      },
    ],
  },
  {
    id: 5,
    name: "Adjustable Dumbbell Set — 5kg to 25kg Per Dumbbell",
    description:
      "Space-saving adjustable dumbbell set with quick-adjust dial mechanism. Replaces 15 sets of weights. High-quality steel plates, ergonomic non-slip grip handle.",
    category: "Gym and Fitness",
    price: 8999,
    originalPrice: 14999,
    rating: 4.8,
    reviewCount: 6742,
    badge: "40% Off",
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Vikram Singh",
        avatar: "https://i.pravatar.cc/40?img=62",
        rating: 5,
        comment:
          "Game changer for home workouts! Build quality is solid and adjustments are quick.",
        date: "2026-07-08",
        verified: true,
      },
      {
        author: "Neha Gupta",
        avatar: "https://i.pravatar.cc/40?img=25",
        rating: 5,
        comment:
          "Worth every rupee. Replaced my entire gym membership with just this!",
        date: "2026-06-30",
        verified: true,
      },
      {
        author: "Suresh Patel",
        avatar: "https://i.pravatar.cc/40?img=68",
        rating: 4,
        comment:
          "Good quality, but the delivery took longer than expected. Product itself is great.",
        date: "2026-06-20",
        verified: false,
      },
    ],
  },
  {
    id: 6,
    name: "PlayStation 5 DualSense Wireless Controller — Midnight Black",
    description:
      "Experience a new era of gaming with the DualSense controller. Features haptic feedback, adaptive triggers, built-in microphone, motion controls and USB-C charging.",
    category: "Video Games",
    price: 5999,
    originalPrice: 6990,
    rating: 4.9,
    reviewCount: 22190,
    badge: "Hot Deal",
    inStock: false,
    images: [
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&auto=format&fit=crop",
    ],
    reviews: [
      {
        author: "Aditya Kumar",
        avatar: "https://i.pravatar.cc/40?img=57",
        rating: 5,
        comment:
          "The haptic feedback is mind-blowing! Every game feels completely different now.",
        date: "2026-07-10",
        verified: true,
      },
      {
        author: "Riya Malhotra",
        avatar: "https://i.pravatar.cc/40?img=31",
        rating: 5,
        comment:
          "Perfect gift for gamers. The adaptive triggers are the best feature I've ever experienced.",
        date: "2026-06-25",
        verified: true,
      },
    ],
  },
];
