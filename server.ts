import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase limit to allow larger carousel image transfers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Check if Gemini AI key is configured
app.get("/api/ai-status", (req, res) => {
  res.json({
    configured: !!process.env.GEMINI_API_KEY,
    model: "gemini-3.5-flash",
  });
});

// Single slide AI analysis endpoint
app.post("/api/audit/slide", async (req, res) => {
  try {
    const { dataUrl, slideIndex, totalSlides, slideName } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: "L'image de la slide (dataUrl) est obligatoire." });
    }

    // Heuristics list to generate realistic review suggestions in fallback mode or in case of errors
    const fallbackReviews = [
      {
        textAmount: "Medium",
        readability: "Excellent",
        contrast: "Excellent",
        score: 85,
        feedback: "La slide est équilibrée. Le titre est bien visible et l'espace négatif est bien respecté. Le contraste est fort.",
        issues: ["Veillez à laisser au moins 10% de marge sur les bords pour éviter le découpage mobile."]
      },
      {
        textAmount: "Low",
        readability: "Excellent",
        contrast: "Excellent",
        score: 92,
        feedback: "Visuel d'accroche très puissant. Le minimalisme permet de capter l'attention immédiatement.",
        issues: []
      },
      {
        textAmount: "High",
        readability: "Fair",
        contrast: "Good",
        score: 68,
        feedback: "Risque de surcharge visuelle. Il y a beaucoup de texte à lire sur cette slide. Pensez à aérer ou à découper en deux slides.",
        issues: ["Surcharge de texte détectée.", "Réduisez la taille du paragraphe pour augmenter l'impact."]
      }
    ];

    const fallback = fallbackReviews[slideIndex % fallbackReviews.length];

    if (!ai) {
      // Return a realistic simulation to be fully functional without API key configured yet
      return res.json({
        ...fallback,
        isSimulated: true,
        message: "Simulateur local actif (configurez GEMINI_API_KEY dans AI Studio pour l'analyse IA réelle)."
      });
    }

    // Extract base64 format and mime type from dataUrl
    // e.g., "data:image/png;base64,iVBORw0KGgoAAAANSRE..."
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.json({
        ...fallback,
        isSimulated: true,
        error: "Format d'image invalide pour l'IA, utilisation du simulateur."
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const prompt = `Vous êtes un expert en design graphique, en marketing de contenu LinkedIn et en création de carrousels à fort engagement. 
Analysez l'image de cette slide (Slide n°${(slideIndex || 0) + 1} d'un carrousel de ${totalSlides || 5} slides) et évaluez :
1. La quantité de texte par rapport à l'espace (Faible, Moyenne, Élevée).
2. La lisibilité globale (Excellente, Bonne, Passable, Mauvaise).
3. Le contraste visuel couleur de fond vs couleur de texte (Excellent, Bon, Moyen, Faible).
4. Un score de qualité globale de design/marketing entre 0 et 100.
5. Un commentaire court d'évaluation en français (max 3 phrases).
6. Une liste de suggestions d'améliorations concrètes en français.

Répondez STRICTEMENT sous forme de JSON correspondant à ce schéma précis :
{
  "textAmount": "Low" | "Medium" | "High",
  "readability": "Excellent" | "Good" | "Fair" | "Poor",
  "contrast": "Excellent" | "Good" | "Fair" | "Poor",
  "score": number,
  "feedback": "string",
  "issues": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textAmount: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            readability: { type: Type.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
            contrast: { type: Type.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["textAmount", "readability", "contrast", "score", "feedback", "issues"]
        }
      }
    });

    const aiText = response.text || "";
    try {
      const parsed = JSON.parse(aiText.trim());
      return res.json({
        ...parsed,
        isSimulated: false
      });
    } catch (parseError) {
      console.error("Erreur de parsing de la réponse AI:", aiText);
      return res.json({
        ...fallback,
        isSimulated: true,
        error: "Échec de lecture des données IA."
      });
    }

  } catch (error: any) {
    console.error("Erreur API Slide Audit:", error);
    res.status(500).json({ error: "Une erreur interne s'est produite lors de l'audit de la slide." });
  }
});

// Holistic carousel audit endpoint
app.post("/api/audit/global", async (req, res) => {
  try {
    const { slidesMetadata, postText } = req.body;

    const totalSlides = slidesMetadata?.length || 0;

    const fallbackConsistencyReview = {
      globalScore: 82,
      coherenceReview: "La palette de couleurs et la typographie semblent cohérentes d'une slide à l'autre, maintenant un style reconnaissable.",
      surchargeRisk: "Faible. La plupart des slides gardent un taux d'occupation de texte raisonnable (< 35% de la surface).",
      tips: [
        "Soignez particulièrement l'accroche sur la Slide 1 : elle doit stopper le scroll des utilisateurs.",
        "Ajoutez un appel à l'action (CTA) clair sur la dernière slide pour inciter à aimer, commenter ou s'abonner.",
        "Utilisez des flèches visuelles ou des indices de progression pour encourager le swipe de carrousel."
      ]
    };

    if (!ai) {
      return res.json({
        ...fallbackConsistencyReview,
        isSimulated: true,
        message: "Audit global simulé (configurez GEMINI_API_KEY dans AI Studio pour l'analyse IA réelle)."
      });
    }

    const prompt = `Vous êtes un rédacteur professionnel de copy LinkedIn de haut niveau et un consultant en communication visuelle. 
Analysez l'ensemble des données d'un projet de carrousel de ${totalSlides} slides :
Métadonnées reçues : ${JSON.stringify(slidesMetadata || [])}
Texte d'accompagnement du post LinkedIn : "${postText || ''}"

Générez un audit de carrousel complet comprenant :
1. Un score de cohérence globale de 0 à 100.
2. Une évaluation globale de la cohérence visuelle et thématique (en français, max 3 phrases).
3. Une évaluation du risque de surcharge de texte ou fatigue cognitive (en français, max 2 phrases).
4. Liste de 4-5 conseils d'amélioration stratégiques de haut niveau (marketing + design, en français).

Répondez STRICTEMENT sous forme de JSON correspondant à ce schéma précis :
{
  "globalScore": number,
  "coherenceReview": "string",
  "surchargeRisk": "string",
  "tips": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalScore: { type: Type.INTEGER },
            coherenceReview: { type: Type.STRING },
            surchargeRisk: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["globalScore", "coherenceReview", "surchargeRisk", "tips"]
        }
      }
    });

    const aiText = response.text || "";
    try {
      const parsed = JSON.parse(aiText.trim());
      return res.json({
        ...parsed,
        isSimulated: false
      });
    } catch (parseError) {
      console.error("Erreur de parsing de l'audit global:", aiText);
      return res.json({
        ...fallbackConsistencyReview,
        isSimulated: true,
        error: "Échec de lecture des résultats IA globaux."
      });
    }

  } catch (error) {
    console.error("Erreur API Global Audit:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'audit global." });
  }
});

// Configure Vite or Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LinkedIn Carousel Tool] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
