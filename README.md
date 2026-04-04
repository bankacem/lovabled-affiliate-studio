# AIPrintVerse - Print-on-Demand Portfolio & Blog

AIPrintVerse is a modern, SEO-optimized portfolio and blog platform for showcasing and selling print-on-demand designs from platforms like Redbubble and TeePublic.

## 🚀 Quick Start (Local Development)

```sh
# Install dependencies (Bun recommended)
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## 🛠 Features

- **SEO First:** Automated Google Indexing API integration, Sitemap generation, and optimized JSON-LD schemas.
- **Admin Dashboard:** Full content management for blog posts and designs.
- **Store Integration:** One-click import from Redbubble and TeePublic.
- **Internal Linking:** Smart internal linking tool for better SEO.
- **Responsive Design:** Mobile-first approach using Tailwind CSS and shadcn/ui.

## 🔑 Environment Variables

To enable Supabase features, create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## 👤 Admin Setup

For instructions on setting up your first admin account and troubleshooting access, please refer to [ADMIN_SETUP.md](./ADMIN_SETUP.md).

## 🚀 Deployment

The project is optimized for deployment on **Vercel**. Simply connect your GitHub repository and configure the environment variables in the Vercel Dashboard.

## 🗄️ Database Migrations

Database schema changes are tracked in the `supabase/migrations/` directory. Use the Supabase CLI or SQL Editor to apply these changes.

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
