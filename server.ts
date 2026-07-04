import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { extractIntent } from "./src/lib/ai/extract-intent";
import { generateQuoteDraft } from "./src/lib/ai/quote-draft";
import { generateEnhancedBio } from "./src/lib/ai/enhance-bio";
import { 
  quoteDraftRequestSchema, 
  quoteRequestSchema, 
  searchProviderSchema, 
  aiSearchProviderSchema,
  enhanceBioSchema,
  formalizationUpdateSchema
} from "./src/lib/api-schema";

import {
  providers,
  catalogItems,
  quotes,
  formalizations,
  updateFormalizationStep,
  getFullProvider,
} from "./src/lib/memory-db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body Parsing Middleware
  app.use(express.json());

  // === API ROUTES (Mounted FIRST) ===
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication integration boundary. A real login/session middleware should
  // validate the HTTP-only cookie and assign the principal to res.locals.
  // No development identity or role is fabricated here.
  app.get("/api/auth/session", (req, res) => {
    const session = res.locals.authSession as unknown;
    if (!session) return res.status(401).json({ error: "No hay una sesión activa." });
    return res.json(session);
  });

  // GET Providers Search
  app.get("/api/providers/search", async (req, res) => {
    try {
      const parsed = searchProviderSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Parámetros de búsqueda inválidos", details: parsed.error.issues });
      }
      const { q, city } = parsed.data;

      // Normalize `q` to a single string (defensive: handles array case from accidental duplicate params)
      const queryStr = Array.isArray(q) ? q[0] : q;

      const results = providers.filter(p => {
        let match = true;
        if (city) {
          match = match && p.city.toUpperCase() === city.toUpperCase();
        }
        if (queryStr) {
          const lowerQ = queryStr.toLowerCase();
          // Match across multiple words; provider matches if ANY word appears in
          // displayName/category OR in any of its catalog items (title/category/
          // subcategory/itemType/description) — per spec §11.1 the algorithm must
          // search inside the catalog, not just the provider name.
          const words = lowerQ.split(/\s+/).filter(Boolean);
          const providerText = (p.displayName + " " + p.category + " " + p.mainCategory).toLowerCase();
          const providerMatch = words.some(w => providerText.includes(w));
          const catalogMatch = words.some(w =>
            catalogItems.some(c => {
              if (c.providerId !== p.id) return false;
              const cText = (
                c.title + " " + c.category + " " + c.subcategory + " " +
                c.itemType + " " + c.description
              ).toLowerCase();
              return cText.includes(w);
            })
          );
          match = match && (providerMatch || catalogMatch);
        }
        return match;
      });

      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal Error" });
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

      let results = providers;
      if (intent.city) {
         results = results.filter(p => p.city.toUpperCase() === intent.city!.toUpperCase().trim());
      }
      if (intent.category) {
         const cat = intent.category.toLowerCase();
         results = results.filter(p => {
           // Match against the provider's own categories...
           const providerCats = (p.category + " " + p.mainCategory).toLowerCase();
           if (providerCats.includes(cat)) return true;
           // ...OR any catalog item whose category/subcategory/itemType matches.
           // (Spec §21.2: the algorithm searches catalog_items.category etc.)
           return catalogItems.some(c => {
             if (c.providerId !== p.id) return false;
             return (
               c.category.toLowerCase().includes(cat) ||
               c.subcategory.toLowerCase().includes(cat) ||
               c.itemType.toLowerCase().includes(cat)
             );
           });
         });
      } else if (intent.keywords && intent.keywords.length > 0) {
         // Use ALL keywords (not just the first) so multi-word queries can still match.
         const kws = intent.keywords.map(k => k.toLowerCase()).filter(Boolean);
         results = results.filter(p => {
           const haystack = (p.displayName + " " + p.category + " " + p.mainCategory).toLowerCase();
           const providerHit = kws.some(k => haystack.includes(k));
           if (providerHit) return true;
           // Also match keywords against the provider's catalog (title/description/etc.)
           return catalogItems.some(c => {
             if (c.providerId !== p.id) return false;
             const cText = (
               c.title + " " + c.category + " " + c.subcategory + " " +
               c.itemType + " " + c.description
             ).toLowerCase();
             return kws.some(k => cText.includes(k));
           });
         });
      }

      res.json({ success: true, intent, data: results });

    } catch (error) {
      res.status(500).json({ success: false, error: "Internal Error" });
    }
  });

  // GET Provider by id OR slug (spec §26.1) — returns the full structured
  // public profile payload: provider + catalog (with equipment join) + photos
  // + medals + verified reviews + computed average review score.
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const full = getFullProvider(req.params.id);
      if (!full) return res.status(404).json({ success: false, message: "No encontrado" });

      res.json({ success: true, data: full });
    } catch (error) {
       res.status(500).json({ success: false });
    }
  });

  // GET Quotes — optionally filtered by ?providerId= (defaults to "1" to
  // preserve the legacy QuotesPage contract which lists the current provider).
  app.get("/api/quotes", async (req, res) => {
    try {
      const providerId = (req.query.providerId as string) || "1";
      const activeQuotes = quotes.filter(q => q.providerId === providerId);
      res.json({ success: true, data: activeQuotes });
    } catch (error) {
       res.status(500).json({ success: false, error: "Internal Error" });
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

  // POST Request Quote
  app.post("/api/quotes", async (req, res) => {
    try {
      const parsed = quoteRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Faltan campos obligatorios", details: parsed.error.issues });
      }

      const { providerId, subject, body, catalogItemId } = parsed.data;

      const newQuote = {
        id: "t" + Date.now(),
        providerId: providerId,
        // Persist the catalog item the request is about (spec §20.3).
        catalogItemId: catalogItemId || null,
        subject: subject || "Solicitud de cotización",
        clientName: "Cliente Nuevo",
        clientAvatar: "CN",
        status: "OPEN",
        date: "Justo ahora",
        messages: [
          { id: "m" + Date.now(), author: "client", text: body, time: "Ahora" }
        ]
      };

      quotes.unshift(newQuote);
      res.json({ success: true, data: newQuote });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Internal Error" });
    }
  });

  // POST Message to Quote Thread
  app.post("/api/quotes/:id/messages", async (req, res) => {
    try {
      const threadId = req.params.id;
      const thread = quotes.find(q => q.id === threadId);
      if (!thread) return res.status(404).json({ error: "Thread not found" });

      const newMsg = {
         id: "m" + Date.now(),
         author: req.body.author || 'provider',
         text: req.body.text,
         time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };

      thread.messages.push(newMsg);
      res.json({ success: true, data: newMsg });
    } catch (e) {
      res.status(500).json({ error: "Server Error" });
    }
  });

  // PUT Update Quote Thread Status
  app.put("/api/quotes/:id", async (req, res) => {
    try {
      const thread = quotes.find(q => q.id === req.params.id);
      if (!thread) return res.status(404).json({ error: "Thread not found" });

      if (req.body.status) {
         thread.status = req.body.status;
      }
      res.json({ success: true, data: thread });
    } catch (e) {
      res.status(500).json({ error: "Server Error" });
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
  app.put("/api/providers/:id", async (req, res) => {
     try {
        const providerId = req.params.id;
        const index = providers.findIndex(p => p.id === providerId);
        if (index === -1) return res.status(404).json({ error: "Provider not found" });
        
        providers[index] = { ...providers[index], ...req.body };
        res.json({ success: true, data: providers[index] });
     } catch(e) {
        res.status(500).json({ error: "Internal Server Error" });
     }
  });

  // GET Formalization Checklist
  app.get("/api/providers/:id/formalization", async (req, res) => {
    try {
      const rules = formalizations[req.params.id] || [];
      res.json({ success: true, data: { steps: rules } });
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // PUT Formalization Checklist
  app.put("/api/providers/:id/formalization", async (req, res) => {
    try {
      const parsed = formalizationUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos de formalización inválidos", details: parsed.error.issues });
      }

      const { stepId, status } = parsed.data;
      
      const updated = updateFormalizationStep(req.params.id, stepId, status);
      
      if (!updated) {
         return res.status(404).json({ error: "Step not found" });
      }

      res.json({ success: true, message: "Estado de formalización actualizado" });
    } catch (error) {
      res.status(500).json({ error: "Error interno del servidor al actualizar formalización" });
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
