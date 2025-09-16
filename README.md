# ImodifAI - AI-Powered Photo Modification

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by AI](https://img.shields.io/badge/Powered%20by-AI-blue?style=for-the-badge)](#)
[![HEIC Support](https://img.shields.io/badge/HEIC%20Support-Yes-green?style=for-the-badge)](#)

## Overview

ImodifAI is an advanced photo modification application that leverages artificial intelligence to transform your images based on natural language descriptions. Simply upload a photo, describe the changes you want to make, and watch as AI brings your vision to life.

### Key Features

- **AI-Powered Transformations**: Describe your desired modifications in plain English
- **HEIC/HEIF Support**: Automatically converts HEIC/HEIF images to JPEG for processing
- **Real-time Processing**: Get results in seconds with real-time progress tracking
- **Secure Processing**: Your images are processed securely and never stored on our servers
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## How It Works

1. **Upload**: Choose a photo from your device (supports JPG, PNG, and HEIC formats)
2. **Describe**: Enter a detailed description of how you want to modify the image
3. **Transform**: Our AI processes your request and generates the modified image
4. **Download**: View and download your transformed photo

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI, Lucide React Icons
- **Image Processing**: Sharp.js, HEIC-Convert
- **AI Processing**: Custom n8n workflow integration
- **Image Hosting**: ImgBB API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/thiagoricci/ImodifAI.git
   cd ImodifAI
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with the required API keys:

   ```env
   IMGBB_API_KEY=your_imgbb_api_key
   ```

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## Usage

1. Click "Upload Photo" to select an image from your device
2. Enter a detailed description of the modifications you want (e.g., "turn the sky into a sunset" or "make the person smile")
3. Click "Transform Photo" to process your image
4. View the results and download your modified image

## API Endpoints

- `/api/modify-photo` - Main endpoint for photo modification
- `/api/convert-heic` - Utility endpoint for HEIC to JPEG conversion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- AI processing powered by custom n8n workflows
- Image hosting provided by ImgBB
- UI components built with Radix UI and Tailwind CSS
- Icons from Lucide React
