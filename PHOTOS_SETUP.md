# Adding Your Photos 📸

## How to Add Your Photos

### Step 1: Prepare Your Photos
1. Choose 4-6 photos of you and Isabel
2. Resize them to be around **800x600 pixels** (or similar aspect ratio)
3. Save them as JPG or PNG files
4. Give them simple names like: `photo1.jpg`, `photo2.jpg`, etc.

### Step 2: Add Photos to the Website
1. Copy your photo files to the `public/photos/` folder
2. Make sure they're named exactly as shown in the code:
   - `photo1.jpg`
   - `photo2.jpg` 
   - `photo3.jpg`
   - `photo4.jpg`

### Step 3: Update Captions (Optional)
Edit the captions in `src/components/Homepage.tsx`:
```typescript
const photos: Photo[] = [
  {
    id: 1,
    src: "/photos/photo1.jpg",
    alt: "Baylor and Isabel",
    caption: "Your custom caption here"  // ← Change this!
  },
  // ... more photos
];
```

### Step 4: Test
1. Save the file
2. Check your browser at `http://localhost:3000`
3. You should see your photos rotating every 5 seconds!

## Photo Tips
- **Aspect Ratio**: Try to use similar aspect ratios for consistent display
- **File Size**: Keep files under 1MB for fast loading
- **Quality**: Use high-quality photos that look good when displayed
- **Variety**: Mix up different types of photos (casual, formal, activities, etc.)

## Troubleshooting
- **Photos not showing?** Check that the file names match exactly
- **Wrong aspect ratio?** The photos will be cropped to fit the container
- **Want more photos?** Just add more entries to the `photos` array in the code 