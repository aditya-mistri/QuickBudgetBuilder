# Budget-First Generative Style Bundle Builder

A full-stack AI-powered outfit recommendation platform that helps Walmart shoppers create stylish, budget-friendly fashion combinations with real-time virtual try-on capabilities.

## Features

- **AI-Powered Outfit Generation**: Uses Google Gemini for intelligent outfit curation
- **Virtual Try-On**: Real-time AI image generation using Replicate models
- **Budget Optimization**: Smart product swapping to stay within budget
- **Photo Upload**: Upload your own photo for personalized try-on
- **Avatar Selection**: Choose from 8 diverse avatar options
- **Persistent Storage**: PostgreSQL database for cart and outfit history

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: Google Gemini + Replicate
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **State Management**: TanStack Query

## Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd budget-style-builder
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# AI Services
GEMINI_API_KEY=your-gemini-api-key-here
REPLICATE_API_TOKEN=r8_your-replicate-token-here

# Application
NODE_ENV=development
PORT=5000
```

## API Keys Setup

### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a Google account if needed
3. Generate a new API key
4. Add it to your `.env` file as `GEMINI_API_KEY`

### Replicate API Token
1. Go to [Replicate](https://replicate.com/account/api-tokens)
2. Create an account
3. Generate a new API token
4. Add it to your `.env` file as `REPLICATE_API_TOKEN`

## Database Schema

The application uses PostgreSQL with the following main tables:
- `products` - Product catalog with details, pricing, and metadata
- `outfits` - Generated outfit combinations
- `cart_items` - User shopping cart items

## AI Integration

### Outfit Generation
- Uses Google Gemini to analyze user preferences
- Generates contextually appropriate outfit combinations
- Provides reasoning for each recommendation

### Virtual Try-On
- Uses Replicate's PhotoMaker model for realistic try-on generation
- Supports both user photos and avatar selection
- Generates high-quality composite images

### Budget Optimization
- AI-powered product swapping to fit budget constraints
- Maintains style coherence while reducing costs
- Provides detailed savings breakdown

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

### Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── lib/         # Utilities
├── server/          # Node.js backend
│   ├── utils/       # AI services and utilities
│   ├── data/        # Static data files
│   └── routes.ts    # API routes
├── shared/          # Shared TypeScript types
└── database/        # Database configuration
```

## Production Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Build the application:
   ```bash
   npm run build
   ```
4. Start production server:
   ```bash
   npm start
   ```

## License

MIT License - see LICENSE file for details