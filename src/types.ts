export interface SlideAIAnalysis {
  textAmount: "Low" | "Medium" | "High";
  readability: "Excellent" | "Good" | "Fair" | "Poor";
  contrast: "Excellent" | "Good" | "Fair" | "Poor";
  score: number;
  feedback: string;
  issues: string[];
}

export interface Slide {
  id: string;
  name: string;
  dataUrl: string; // Base64 data string
  size: number; // File size in bytes
  width: number;
  height: number;
  isValidDimensions: boolean; // Exactly 1080x1350 px
  aiAnalysis?: SlideAIAnalysis & {
    isLoading?: boolean;
    error?: string;
    isSimulated?: boolean;
  };
}

export interface LinkedInPost {
  authorName: string;
  authorTitle: string;
  authorAvatar: string; // base64 or public avatar link
  postText: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  hasLiked?: boolean;
}

export interface CarouselProject {
  id: string;
  name: string;
  createdAt: string;
  slides: Slide[];
  post: LinkedInPost;
}

export interface GlobalAudit {
  globalScore: number;
  coherenceReview: string;
  surchargeRisk: string;
  tips: string[];
  isLoading?: boolean;
  error?: string;
  isSimulated?: boolean;
}
