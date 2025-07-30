# Deployment Guide for The Jeppsens

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Prepare Your Repository
1. Make sure your code is pushed to a GitHub repository
2. Ensure all dependencies are properly installed (`npm install`)

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy"

### Step 3: Configure Environment Variables (Optional)
If you plan to add Supabase later, you can add these environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Custom Domain (Optional)
1. In your Vercel project dashboard, go to "Settings" → "Domains"
2. Add your custom domain (e.g., `thejeppsens.com`)
3. Follow the DNS configuration instructions

## 🌐 Alternative Deployment Options

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Deploy

### Railway
1. Connect your GitHub repository to Railway
2. Railway will automatically detect and deploy your Next.js app
3. Set environment variables if needed

## 📱 Mobile Optimization
The app is already optimized for mobile devices with:
- Responsive design
- Touch-friendly interfaces
- Mobile-optimized navigation
- Progressive Web App features

## 🔧 Post-Deployment Customization

### Update Photos
Replace the sample photos in `src/components/Homepage.tsx` with your own couple photos:
```typescript
const samplePhotos = [
  {
    id: 1,
    src: "your-photo-url-1",
    alt: "Your photo description",
    caption: "Your caption"
  },
  // ... more photos
];
```

### Update Branding
Modify the branding throughout the app:
- Update the title in `src/app/layout.tsx`
- Change colors in `src/app/globals.css`
- Update copy in components

### Add Your Data
- Add your favorite restaurants in the Restaurant Picker
- Add your movie collection in the Movie Picker
- Create custom brackets for your competitions

## 🎯 Performance Optimization

The app is already optimized with:
- Next.js 14 App Router
- TypeScript for type safety
- Tailwind CSS for efficient styling
- Framer Motion for smooth animations
- Lazy loading and code splitting

## 🔒 Security Considerations

- No authentication required for current features
- All data is stored locally in the browser
- When adding Supabase, implement proper authentication
- Use environment variables for sensitive data

## 📊 Analytics (Optional)

Add analytics to track usage:
1. Google Analytics
2. Vercel Analytics
3. Plausible Analytics

## 🆘 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run build`
- Verify all imports are correct

### Deployment Issues
- Check Vercel build logs for errors
- Ensure environment variables are set correctly
- Verify domain DNS settings

### Performance Issues
- Optimize images using Next.js Image component
- Enable Vercel's edge caching
- Monitor Core Web Vitals in Vercel Analytics

---

Your app should now be live and ready for date nights! 🎉 