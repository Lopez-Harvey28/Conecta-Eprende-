import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import cookieParser from "cookie-parser";
import { extractIntent } from "./src/lib/ai/extract-intent";
import { generateQuoteDraft } from "./src/lib/ai/quote-draft";
import { generateEnhancedBio } from "./src/lib/ai/enhance-bio";
import {
  quoteDraftRequestSchema,
  quoteRequestSchema,
  searchProviderSchema,
  aiSearchProviderSchema,
  enhanceBioSchema,
  formalizationUpdateSchema,
  registerSchema,
  loginSchema,
} from "./src/lib/api-schema";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getRefreshTokenExpiryDate,
  generateSecureToken,
  type TokenPayload,
} from "./src/lib/auth";
import { prisma } from "./src/lib/db";
import {
  searchProviders,
  getFullProviderByIdOrSlug,
  updateProvider as updateProviderService,
  getProviderMapData,
} from "./src/lib/providers-service";
import {
  searchCatalogItems,
} from "./src/lib/catalog-service";
import {
  getThreadsByProvider,
  getThreadsBySender,
  createThread,
  getThreadById,
  addMessage,
  updateThread,
} from "./src/lib/quotes-service";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body Parsing Middleware
  app.use(express.json());
  app.use(cookieParser());

  // === AUTH MIDDLEWARE ===
  const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const accessToken = req.cookies?.access_token;
    if (!accessToken) {
      return res.status(401).json({ success: false, error: "No autenticado" });
    }
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return res.status(401).json({ success: false, error: "Sesión expirada" });
    }
    (req as any).user = payload;
    next();
  };

  // ──────────────────────────────────────────────────────────
  // AUTH ROUTES
  // ──────────────────────────────────────────────────────────

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: parsed.error.issues.map(i => i.message),
        });
      }

      const { name, email, password } = parsed.data;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Este correo ya está registrado",
        });
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER",
        },
        select: { id: true, email: true, name: true, role: true },
      });

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiryDate(),
        },
      });

      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ success: false, error: "Error al registrar usuario" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: parsed.error.issues.map(i => i.message),
        });
      }

      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, password: true },
      });

      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          error: "Credenciales inválidas",
        });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({
          success: false,
          error: "Credenciales inválidas",
        });
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiryDate(),
        },
      });

      setAuthCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "Error al iniciar sesión" });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      }
      clearAuthCookies(res);
      res.json({ success: true, message: "Sesión cerrada" });
    } catch (error) {
      clearAuthCookies(res);
      res.json({ success: true, message: "Sesión cerrada" });
    }
  });

  // POST /api/auth/refresh
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const incomingRefreshToken = getRefreshTokenFromRequest(req);
      if (!incomingRefreshToken) {
        return res.status(401).json({ success: false, error: "No hay refresh token" });
      }

      const payload = verifyRefreshToken(incomingRefreshToken);
      if (!payload) {
        return res.status(401).json({ success: false, error: "Refresh token inválido o expirado" });
      }

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: incomingRefreshToken },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(401).json({ success: false, error: "Refresh token expirado" });
      }

      await prisma.refreshToken.delete({ where: { token: incomingRefreshToken } });

      const newPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: getRefreshTokenExpiryDate(),
        },
      });

      setAuthCookies(res, newAccessToken, newRefreshToken);

      res.json({ success: true, message: "Tokens renovados" });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ success: false, error: "Error al renovar la sesión" });
    }
  });

  // GET /api/auth/me
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const { userId } = (req as any).user;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          providers: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              verified: true,
              formalizationStatus: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      res.json({ success: true, data: { user } });
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ success: false, error: "Error al obtener usuario" });
    }
  });

  // GET /api/auth/google — initiate OAuth
  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    if (!clientId) {
      return res.status(503).json({
        success: false,
        error: "OAuth con Google no está configurado",
      });
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const scope = encodeURIComponent("openid email profile");

    const authUrl = [
      "https://accounts.google.com/o/oauth2/v2/auth",
      `?client_id=${clientId}`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      "&response_type=code",
      "&scope=openid email profile",
      "&access_type=offline",
      "&prompt=consent",
    ].join("");

    res.redirect(authUrl);
  });

  // GET /api/auth/google/callback — handle OAuth
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, error } = req.query;
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    if (error || !code) {
      return res.redirect(`${appUrl}/auth/login?error=oauth_failed`);
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri = `${appUrl}/api/auth/google/callback`;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        return res.redirect(`${appUrl}/auth/login?error=oauth_token_failed`);
      }

      const tokenData = await tokenResponse.json() as { id_token: string };
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${tokenData.id_token}` } }
      );

      if (!userInfoResponse.ok) {
        return res.redirect(`${appUrl}/auth/login?error=oauth_userinfo_failed`);
      }

      const googleUser = await userInfoResponse.json() as {
        id: string;
        email: string;
        name?: string;
        picture?: string;
      };

      let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || googleUser.email.split("@")[0],
            image: googleUser.picture,
            emailVerified: new Date(),
          },
        });
      }

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleUser.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          provider: "google",
          providerAccountId: googleUser.id,
          access_token: tokenData.id_token,
        },
      });

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiryDate(),
        },
      });

      setAuthCookies(res, accessToken, refreshToken);

      res.redirect(`${appUrl}/`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${appUrl}/auth/login?error=oauth_server_error`);
    }
  });

  // GET /api/auth/google/callback (alternative: query param error) handled above

  // === API ROUTES (Mounted FIRST) ===
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GET Providers Search
  app.get("/api/providers/search", async (req, res) => {
    try {
      const parsed = searchProviderSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Parámetros de búsqueda inválidos", details: parsed.error.issues });
      }
      const { q, city } = parsed.data;

      const results = await searchProviders({
        q: Array.isArray(q) ? q[0] : q,
        city,
      });

      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Provider search error:", error);
      res.status(500).json({ success: false, error: "Error al buscar proveedores" });
    }
  });

  // POST Providers AI Search
  app.post("/api/providers/ai-search", async (req, res) => {
    try {
      const parsed = aiSearchProviderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Solicitud inválida", details: parsed.error.issues });
      }
      const { query } = parsed.data;

      const intent = await extractIntent(query);

      // First get all providers matching city if provided
      let providers = await searchProviders({ city: intent.city || undefined });

      if (intent.category) {
        const cat = intent.category.toLowerCase();
        // Filter by category in-memory (matches mainCategory or category)
        providers = providers.filter(p => {
          const providerCats = ((p.category || "") + " " + (p.mainCategory || "")).toLowerCase();
          if (providerCats.includes(cat)) return true;
          return false;
        });
      } else if (intent.keywords && intent.keywords.length > 0) {
        const kws = intent.keywords.map(k => k.toLowerCase()).filter(Boolean);
        providers = providers.filter(p => {
          const haystack = ((p.displayName || "") + " " + (p.category || "") + " " + (p.mainCategory || "")).toLowerCase();
          return kws.some(k => haystack.includes(k));
        });
      }

      res.json({ success: true, intent, data: providers });

    } catch (error) {
      console.error("AI search error:", error);
      res.status(500).json({ success: false, error: "Error en búsqueda IA" });
    }
  });

  // GET Provider by id OR slug (spec §26.1)
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const full = await getFullProviderByIdOrSlug(req.params.id);
      if (!full) return res.status(404).json({ success: false, message: "No encontrado" });

      res.json({ success: true, data: full });
    } catch (error) {
      console.error("Get provider error:", error);
      res.status(500).json({ success: false, error: "Error al obtener proveedor" });
    }
  });

  // GET Quotes — optionally filtered by ?providerId= or ?senderId=
  // For MVP: returns threads by providerId (backward compatible)
  // After auth: use ?senderId= with auth middleware to get user's threads
  app.get("/api/quotes", async (req, res) => {
    try {
      const providerId = req.query.providerId as string | undefined;
      const senderId = req.query.senderId as string | undefined;

      if (senderId) {
        const threads = await getThreadsBySender(senderId);
        return res.json({ success: true, data: threads });
      }

      if (providerId) {
        const threads = await getThreadsByProvider(providerId);
        return res.json({ success: true, data: threads });
      }

      res.json({ success: true, data: [] });
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ success: false, error: "Error al obtener cotizaciones" });
    }
  });

  // POST Generate AI Quote Draft (Left intact as it hits external API or mocked local)
  app.post("/api/quotes/draft", async (req, res) => {
    try {
      const parsed = quoteDraftRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Campos inválidos", details: parsed.error.issues });
      }
      const { idea, providerName } = parsed.data;

      const draft = await generateQuoteDraft(idea, providerName);
      res.json({ success: true, draft });
    } catch (error) {
      res.status(500).json({ error: "Ocurrió un error al intentar redactar la cotización. Por favor, intenta de nuevo." });
    }
  });

  // POST Request Quote — creates a new quote thread
  app.post("/api/quotes", async (req, res) => {
    try {
      const parsed = quoteRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Faltan campos obligatorios", details: parsed.error.issues });
      }

      const { providerId, subject, body, catalogItemId } = parsed.data;

      // For authenticated requests, use the authenticated user as sender
      // For now, use a default senderId (will be replaced when auth is connected)
      const senderId = (req as any).user?.userId || (req.body.senderId as string) || "anonymous";

      const newQuote = await createThread({
        senderId,
        providerId,
        catalogItemId,
        subject: subject || "Solicitud de cotización",
        initialMessage: body,
      });

      res.status(201).json({ success: true, data: newQuote });
    } catch (error) {
      console.error("Create quote error:", error);
      res.status(500).json({ success: false, error: "Error al crear cotización" });
    }
  });

  // POST Message to Quote Thread
  app.post("/api/quotes/:id/messages", async (req, res) => {
    try {
      const threadId = req.params.id;
      const { text, authorRole } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, error: "El mensaje es obligatorio" });
      }

      // For authenticated requests, use the authenticated user
      const authorId = (req as any).user?.userId || req.body.authorId || "anonymous";
      const role = authorRole || ((req as any).user?.role === "PROVIDER" ? "provider" : "client");

      const newMsg = await addMessage(threadId, {
        authorId,
        authorRole: role,
        body: text,
      });

      res.status(201).json({ success: true, data: newMsg });
    } catch (error) {
      console.error("Add message error:", error);
      res.status(500).json({ success: false, error: "Error al agregar mensaje" });
    }
  });

  // PUT Update Quote Thread Status
  app.put("/api/quotes/:id", async (req, res) => {
    try {
      const threadId = req.params.id;
      const { status, quotedPriceLabel, quotedDeliveryTime } = req.body;

      const existing = await prisma.quoteThread.findUnique({
        where: { id: threadId },
        select: { id: true, status: true },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: "Thread no encontrado" });
      }

      const updated = await updateThread(threadId, {
        status,
        quotedPriceLabel,
        quotedDeliveryTime,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update quote error:", error);
      res.status(500).json({ success: false, error: "Error al actualizar cotización" });
    }
  });

  // POST Generate AI Enhanced Bio
  app.post("/api/providers/enhance-bio", async (req, res) => {
    try {
      const parsed = enhanceBioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Campos inválidos", details: parsed.error.issues });
      }
      const { bio, category } = parsed.data;

      const enhanced = await generateEnhancedBio(bio, category);
      res.json({ success: true, bio: enhanced });
    } catch (error) {
      res.status(500).json({ error: "No pudimos conectar con la Inteligencia Artificial para mejorar el texto. Inténtalo de nuevo más tarde." });
    }
  });

  // PUT Update Profile
  app.put("/api/providers/:id", authenticate, async (req, res) => {
    try {
      const providerId = req.params.id;
      const { userId } = (req as any).user;

      // Verify the authenticated user owns this provider
      const existing = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { userId: true },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: "Proveedor no encontrado" });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, error: "No tenés permiso para editar este proveedor" });
      }

      const allowedFields = [
        "displayName", "bio", "logoUrl", "coverImageUrl", "city",
        "department", "serviceRadius", "category", "mainCategory", "subcategories",
        "priceMin", "priceMax", "priceRange", "businessHours", "deliveryOptions",
        "availability", "shortDescription", "aboutDescription", "lat", "lng",
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const updated = await prisma.provider.update({
        where: { id: providerId },
        data: updateData,
      });

      res.json({ success: true, data: updated });
    } catch(e) {
      console.error("Update provider error:", e);
      res.status(500).json({ success: false, error: "Error al actualizar proveedor" });
    }
  });

  // GET Catalog Item by ID
  app.get("/api/catalog-items/:id", async (req, res) => {
    try {
      const item = await prisma.catalogItem.findUnique({
        where: { id: req.params.id },
        include: { provider: { select: { id: true, displayName: true, city: true, trustScore: true } } },
      });
      if (!item) {
        return res.status(404).json({ success: false, error: "Item no encontrado" });
      }
      res.json({ success: true, data: item });
    } catch (e) {
      console.error("Get catalog item error:", e);
      res.status(500).json({ success: false, error: "Error al obtener item" });
    }
  });

  // POST Create Catalog Item
  app.post("/api/catalog-items", authenticate, async (req, res) => {
    try {
      const { userId } = (req as any).user;
      const { providerId, title, itemType, category, subcategory, description, priceMin, priceMax, currency, priceUnit, city, availabilityStatus, deliveryAvailable, pickupAvailable, mainImageUrl } = req.body;

      if (!providerId || !title || !itemType || !category || !description) {
        return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
      }

      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { userId: true },
      });
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ success: false, error: "No tenés permiso para agregar items a este proveedor" });
      }

      const item = await prisma.catalogItem.create({
        data: {
          providerId,
          title,
          itemType: itemType || "SERVICIO_ESPECIALIZADO",
          category,
          subcategory: subcategory || "",
          description,
          priceMin: priceMin ? Number(priceMin) : null,
          priceMax: priceMax ? Number(priceMax) : null,
          currency: currency || "NIO",
          priceUnit: priceUnit || null,
          city: city || "MANAGUA",
          availabilityStatus: availabilityStatus || "DISPONIBLE",
          deliveryAvailable: deliveryAvailable || false,
          pickupAvailable: pickupAvailable || false,
          mainImageUrl: mainImageUrl || null,
        },
      });

      res.status(201).json({ success: true, data: item });
    } catch (e) {
      console.error("Create catalog item error:", e);
      res.status(500).json({ success: false, error: "Error al crear item" });
    }
  });

  // PUT Update Catalog Item
  app.put("/api/catalog-items/:id", authenticate, async (req, res) => {
    try {
      const { userId } = (req as any).user;
      const itemId = req.params.id;

      const existing = await prisma.catalogItem.findUnique({
        where: { id: itemId },
        include: { provider: { select: { userId: true } } },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: "Item no encontrado" });
      }

      if (existing.provider.userId !== userId) {
        return res.status(403).json({ success: false, error: "No tenés permiso para editar este item" });
      }

      const allowedFields = ["title", "itemType", "category", "subcategory", "description", "priceMin", "priceMax", "priceUnit", "city", "availabilityStatus", "deliveryAvailable", "pickupAvailable", "mainImageUrl"];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (["priceMin", "priceMax"].includes(field)) {
            updateData[field] = req.body[field] ? Number(req.body[field]) : null;
          } else {
            updateData[field] = req.body[field];
          }
        }
      }

      const updated = await prisma.catalogItem.update({
        where: { id: itemId },
        data: updateData,
      });

      res.json({ success: true, data: updated });
    } catch (e) {
      console.error("Update catalog item error:", e);
      res.status(500).json({ success: false, error: "Error al actualizar item" });
    }
  });

  // DELETE Catalog Item
  app.delete("/api/catalog-items/:id", authenticate, async (req, res) => {
    try {
      const { userId } = (req as any).user;
      const itemId = req.params.id;

      const existing = await prisma.catalogItem.findUnique({
        where: { id: itemId },
        include: { provider: { select: { userId: true } } },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: "Item no encontrado" });
      }

      if (existing.provider.userId !== userId) {
        return res.status(403).json({ success: false, error: "No tenés permiso para eliminar este item" });
      }

      await prisma.catalogItem.delete({ where: { id: itemId } });
      res.json({ success: true, message: "Item eliminado" });
    } catch (e) {
      console.error("Delete catalog item error:", e);
      res.status(500).json({ success: false, error: "Error al eliminar item" });
    }
  });

  // GET Formalization Checklist
  app.get("/api/providers/:id/formalization", async (req, res) => {
    try {
      const checklist = await prisma.formalizationChecklist.findUnique({
        where: { providerId: req.params.id },
      });
      res.json({ success: true, data: { steps: checklist?.steps || [] } });
    } catch (error) {
      console.error("Get formalization error:", error);
      res.status(500).json({ success: false, error: "Error al obtener checklist" });
    }
  });

  // PUT Formalization Checklist
  app.put("/api/providers/:id/formalization", authenticate, async (req, res) => {
    try {
      const parsed = formalizationUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Datos inválidos", details: parsed.error.issues });
      }

      const { stepId, status } = parsed.data;
      const providerId = req.params.id;

      // Get existing checklist
      let checklist = await prisma.formalizationChecklist.findUnique({
        where: { providerId },
      });

      if (!checklist) {
        return res.status(404).json({ success: false, error: "Checklist no encontrado" });
      }

      // Update the step in the JSON array
      const steps = checklist.steps as Array<{ id: string; title: string; description: string; status: string }>;
      let stepFound = false;
      let nextCurrentIndex = -1;

      for (let i = 0; i < steps.length; i++) {
        if (steps[i].id === stepId) {
          steps[i].status = status;
          stepFound = true;
          if (status === "completed") {
            nextCurrentIndex = i + 1;
          }
        }
      }

      if (!stepFound) {
        return res.status(404).json({ success: false, error: "Step no encontrado" });
      }

      // Auto-advance next pending step to current
      if (nextCurrentIndex !== -1 && nextCurrentIndex < steps.length) {
        if (steps[nextCurrentIndex].status === "pending") {
          steps[nextCurrentIndex].status = "current";
        }
      }

      const updated = await prisma.formalizationChecklist.update({
        where: { providerId },
        data: { steps },
      });

      res.json({ success: true, message: "Estado de formalización actualizado", data: { steps: updated.steps } });
    } catch (error) {
      console.error("Update formalization error:", error);
      res.status(500).json({ success: false, error: "Error al actualizar formalización" });
    }
  });

  // GET Reviews by Provider
  app.get("/api/providers/:id/reviews", async (req, res) => {
    try {
      const reviews = await prisma.review.findMany({
        where: { providerId: req.params.id },
        include: { reviewer: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ success: false, error: "Error al obtener reseñas" });
    }
  });

  // POST Create Review
  app.post("/api/reviews", authenticate, async (req, res) => {
    try {
      const { providerId, qualityScore, responseTimeScore, fulfillmentScore, communicationScore, valueScore, comment } = req.body;
      const { userId } = (req as any).user;

      if (!providerId || !qualityScore) {
        return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
      }

      const generalScore = (qualityScore + (responseTimeScore || qualityScore) + (fulfillmentScore || qualityScore) + (communicationScore || qualityScore) + (valueScore || qualityScore)) / 5;

      const review = await prisma.review.create({
        data: {
          providerId,
          reviewerId: userId,
          qualityScore,
          responseTimeScore: responseTimeScore || qualityScore,
          fulfillmentScore: fulfillmentScore || qualityScore,
          communicationScore: communicationScore || qualityScore,
          valueScore: valueScore || qualityScore,
          generalScore,
          comment,
        },
        include: { reviewer: { select: { id: true, name: true, image: true } } },
      });

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ success: false, error: "Error al crear reseña" });
    }
  });

  // === VITE MIDDLEWARE OR STATIC SERVING ===
  // Production is explicit. `npm run dev` must keep Vite/HMR active even when a
  // previous production build exists in dist.
  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  let vite: ViteDevServer | null = null;
  if (!isProduction) {
    // Development mode via Vite middleware
    console.log("Setting up Vite dev server...");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // we handle SPA fallback ourselves below
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode - serve static built assets
    app.use(express.static(distPath));
  }

  // SPA fallback: serve index.html for any non-API GET request that wasn't matched above.
  // Required for client-side routes like /buscar, /dashboard/*, /proveedor/:id.
  // NOTE: Express 4 (path-to-regexp 0.1.x) does NOT support '*all' wildcard syntax
  // (that is Express 5 only). The correct wildcard here is '*'.
  app.get('*', async (req, res, next) => {
    // Skip API routes entirely (they should have responded already, but be defensive)
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    try {
      if (vite) {
        // Dev: read source index.html and let Vite transform it (injects HMR client, etc.)
        const template = fs.readFileSync(
          path.resolve(process.cwd(), 'index.html'),
          'utf-8'
        );
        const html = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } else {
        // Prod: send the prebuilt index.html
        res.sendFile(distIndexHtml);
      }
    } catch (err) {
      next(err);
    }
  });

  // Start the actual express server on host 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Conecta Emprende AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
