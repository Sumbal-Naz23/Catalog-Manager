# Catalog Manager

A full-stack product catalog management web app built with Next.js, MongoDB, and Cloudinary. Organize product images into folders with a beautiful Pinterest-style grid UI. PWA-ready for mobile installation.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: MongoDB + Mongoose
- **Image Storage**: Cloudinary
- **PWA**: Web App Manifest + Service Worker

---

## Features

- 📁 Create, rename, delete folders
- 🖼️ Upload multiple images with drag & drop
- 🗑️ Delete images with confirmation
- 📱 PWA — installable as a native mobile app
- ⚡ Lazy-loaded images via Next.js `<Image>`
- 🎨 Clean SaaS-style dashboard UI
- 🔔 Toast notifications for all actions

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd catalog-manager
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/catalog-manager
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Getting MongoDB URI
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Click **Connect** → **Connect your application**
4. Copy the connection string and replace `<password>`

#### Getting Cloudinary Credentials
1. Go to [Cloudinary Console](https://console.cloudinary.com)
2. Your **Cloud Name**, **API Key**, and **API Secret** are on the dashboard

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

---

## PWA Setup Guide

### Generating App Icons

You need icons in these sizes: 72, 96, 128, 144, 152, 192, 384, 512px.

**Option A — Using pwa-asset-generator:**
```bash
npx pwa-asset-generator your-logo.png ./public/icons --manifest ./public/manifest.json
```

**Option B — Online tool:**
1. Go to [realfavicongenerator.net](https://realfavicongenerator.net)
2. Upload your logo
3. Download and place icons in `public/icons/`

### Installing on Mobile (iOS)

1. Open the app in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

### Installing on Android / Desktop (Chrome)

1. Open the app in Chrome
2. Tap the **Install** button in the address bar (or menu → Install app)

---

## Project Structure

```
catalog-manager/
├── app/
│   ├── api/
│   │   ├── folders/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # PATCH rename, DELETE
│   │   └── images/
│   │       ├── route.ts          # GET by folderId
│   │       ├── upload/route.ts   # POST upload to Cloudinary
│   │       └── [id]/route.ts     # DELETE image
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Main dashboard
│   ├── globals.css
│   ├── layout.tsx                # Root layout + PWA meta
│   └── page.tsx                  # Landing page
├── components/
│   ├── ConfirmDialog.tsx          # Reusable confirm modal
│   ├── ImageGrid.tsx              # Pinterest-style grid + upload
│   ├── Sidebar.tsx                # Folder navigation
│   └── Toast.tsx                  # Notification toasts
├── hooks/
│   ├── useFolders.ts              # Folder CRUD state
│   └── useImages.ts               # Image CRUD + upload state
├── lib/
│   ├── cloudinary.ts              # Cloudinary config
│   └── mongodb.ts                 # MongoDB connection
├── models/
│   ├── Folder.ts                  # Mongoose Folder model
│   └── Image.ts                   # Mongoose Image model
├── public/
│   ├── icons/                     # PWA icons (add yours here)
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
└── .env.local                     # Environment variables
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | List all folders |
| POST | `/api/folders` | Create folder `{ name }` |
| PATCH | `/api/folders/:id` | Rename folder `{ name }` |
| DELETE | `/api/folders/:id` | Delete folder + all images |
| GET | `/api/images?folderId=` | List images in folder |
| POST | `/api/images/upload` | Upload images (multipart) |
| DELETE | `/api/images/:id` | Delete single image |
