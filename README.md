# The Jeppsens 🏠

Our little corner of the internet - a beautiful and fun React-based web app for Baylor and Isabel to enjoy together.

## ✨ Features

### 🏠 Homepage
- Beautiful landing page with rotating photo carousel
- Welcoming design with "Our little corner of the internet" branding
- Responsive layout optimized for mobile and desktop

### 🍽️ Restaurant Picker
- Add our favorite restaurants with custom tags
- Filter by price range (cheap, moderate, fancy)
- Filter by distance (close, medium, far)
- Spin animation to randomly select a restaurant
- Beautiful result display with restaurant details

### 🎬 Movie Picker
- Add movies with genre tags and metadata
- Filter by genre, type (live action/animated), and duration
- Movie modal with detailed information
- Spin to randomly select a movie for date night

### 🏆 Bracket Builder
- Create March Madness-style tournaments
- Support for 4, 8, or 16 contestants
- Interactive bracket progression with smooth animations
- Confetti celebration when a winner is selected
- Perfect for ranking competitions and decision-making

### 🎯 Keep 4 / Cut 4
- Choose our top 4 from 8 options
- Elegant grid interface with selection indicators
- Smooth transitions and visual feedback
- "Our Final 4" summary display
- Great for narrowing down choices together

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd thejeppsens
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🎨 Design Features

- **Modern Aesthetic**: Clean, playful design with soft colors and elegant fonts
- **Mobile-First**: Optimized for mobile devices with responsive design
- **Smooth Animations**: Framer Motion animations for delightful user experience
- **Custom Color Palette**: Pink, purple, orange, and teal gradients
- **Beautiful Typography**: Inter and Playfair Display font combination

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Confetti**: React Confetti
- **Deployment**: Vercel (recommended)

## 📱 Mobile Optimization

The app is fully optimized for mobile use with:
- Touch-friendly interfaces
- Responsive grid layouts
- Mobile-optimized navigation
- Swipe-friendly interactions

## 🔮 Future Features

- [ ] Supabase integration for data persistence
- [ ] User authentication and accounts
- [ ] Google Sheets budget tracker integration
- [ ] Relationship tracker with friend hangout reminders
- [ ] Goal tracker for personal/couple goals
- [ ] Photo upload and management
- [ ] Shared calendar integration

## 🎯 Perfect For

- **Date Night Planning**: Restaurant and movie selection
- **Decision Making**: Bracket competitions and choice narrowing
- **Couple Activities**: Interactive games and tools
- **Memory Making**: Photo sharing and relationship tracking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 Customization

### Colors
Update the color palette in `src/app/globals.css`:
```css
:root {
  --primary-pink: 236, 72, 153;
  --primary-purple: 147, 51, 234;
  --accent-orange: 251, 146, 60;
  --accent-teal: 20, 184, 166;
}
```

### Photos
Replace the sample photos in `src/components/Homepage.tsx` with your own couple photos.

### Content
Update the branding and copy throughout the components to match your preferences.

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your own relationship!

## 📄 License

This project is for personal use. Feel free to use and modify for your own relationship adventures.

---

Built with ❤️ for date nights and decision-making adventures
