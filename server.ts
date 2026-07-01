import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import muhammara from "muhammara";
import { db } from "./src/db/index";
import { clients, quotes, clientFiles } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

// Database seeding helper
async function seedDatabase() {
  try {
    const existingClients = await db.select().from(clients);
    if (existingClients.length === 0) {
      console.log("Seeding database with default client data...");
      
      const [c1] = await db.insert(clients).values({
        name: "Christian Ndolo",
        company: "Securimax",
        email: "c.ndolo@securimax.com",
        phone: "+33 6 12 34 56 78",
        notes: "Client historique pour de la vidéosurveillance d'entrepôts. Intéressé par Voltplan Designer."
      }).returning();

      const [c2] = await db.insert(clients).values({
        name: "Marie-Laure Kone",
        company: "Grand Hôtel Palace",
        email: "ml.kone@palacehotel.com",
        phone: "+33 7 98 76 54 32",
        notes: "Besoin de portail captif WiFi Zone pour les clients de l'hôtel. 12 bornes requises."
      }).returning();

      const [c3] = await db.insert(clients).values({
        name: "Sylvain Dubois",
        company: "Finatech",
        email: "s.dubois@finatech.fr",
        phone: "+33 1 45 67 89 00",
        notes: "Projet d'architecture Zero-Trust d'envergure. Audits de vulnérabilité requis."
      }).returning();

      await db.insert(quotes).values([
        {
          clientId: c1.id,
          service: "Vidéosurveillance & CCTV",
          budget: "5 000 € - 10 000 €",
          description: "Déploiement de 45 caméras IP 4K avec analyse intelligente et franchissement de ligne.",
          totalEst: 7850,
          status: "approved",
          materials: JSON.stringify([
            { name: "Caméra IP Dôme 4K", qty: 25, total: 6225 },
            { name: "Enregistreurs NVR", qty: 2, total: 800 },
            { name: "Switch PoE", qty: 3, total: 825 }
          ])
        },
        {
          clientId: c2.id,
          service: "Réseaux & Télécoms",
          budget: "1 500 € - 5 000 €",
          description: "Installation de 12 bornes Wi-Fi 6 Pro et routeur principal MikroTik pour portail captif public.",
          totalEst: 3450,
          status: "new",
          materials: JSON.stringify([
            { name: "Borne Wi-Fi 6 Pro", qty: 12, total: 2268 },
            { name: "Routeur VPN MikroTik CCR", qty: 1, total: 599 },
            { name: "Switch PoE Manageable 24p", qty: 1, total: 349 }
          ])
        },
        {
          clientId: c3.id,
          service: "Cybersécurité Avancée",
          budget: "10 000 €+",
          description: "Mise en place d'un pare-feu redondant Fortinet et surveillance SOC 24/7.",
          totalEst: 14500,
          status: "contacted",
          materials: JSON.stringify([
            { name: "Routeur VPN MikroTik CCR", qty: 4, total: 2396 }
          ])
        }
      ]);

      await db.insert(clientFiles).values([
        {
          clientId: c1.id,
          fileName: "Securimax_CCTV_Plan.pdf",
          fileSize: "4.2 MB",
          fileType: "application/pdf"
        },
        {
          clientId: c1.id,
          fileName: "Schema_Reseau_Entrepots.xlsx",
          fileSize: "1.8 MB",
          fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        },
        {
          clientId: c2.id,
          fileName: "Etude_Couverture_Wifi_Palace.png",
          fileSize: "2.4 MB",
          fileType: "image/png"
        }
      ]);

      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Seed the PostgreSQL database on startup
  await seedDatabase();

  // CRM API: Get all clients with quotes and files
  app.get("/api/crm/clients", async (req, res) => {
    try {
      const allClients = await db.query.clients.findMany({
        with: {
          quotes: true,
          files: true
        },
        orderBy: (clients, { desc }) => [desc(clients.createdAt)]
      });
      res.json(allClients);
    } catch (error) {
      console.error("Error fetching CRM clients:", error);
      res.status(500).json({ error: "Failed to fetch clients from PostgreSQL" });
    }
  });

  // CRM API: Create client
  app.post("/api/crm/clients", async (req, res) => {
    try {
      const { name, company, email, phone, notes } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and Email are required" });
      }
      
      const [newClient] = await db.insert(clients).values({
        name,
        company: company || "Particulier",
        email,
        phone: phone || "",
        notes: notes || ""
      }).returning();

      res.status(201).json(newClient);
    } catch (error: any) {
      console.error("Error creating CRM client:", error);
      if (error.code === '23505') { // Duplicate email unique constraint
        return res.status(400).json({ error: "Un client avec cet e-mail existe déjà." });
      }
      res.status(500).json({ error: "Failed to create client in PostgreSQL" });
    }
  });

  // CRM API: Update client
  app.put("/api/crm/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, company, email, phone, notes } = req.body;
      
      const [updatedClient] = await db.update(clients)
        .set({
          name,
          company,
          email,
          phone,
          notes
        })
        .where(eq(clients.id, id))
        .returning();

      res.json(updatedClient);
    } catch (error: any) {
      console.error("Error updating CRM client:", error);
      res.status(500).json({ error: "Failed to update client in PostgreSQL" });
    }
  });

  // CRM API: Delete client
  app.delete("/api/crm/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(clients).where(eq(clients.id, id));
      res.json({ success: true, message: "Client supprimé" });
    } catch (error) {
      console.error("Error deleting CRM client:", error);
      res.status(500).json({ error: "Failed to delete client in PostgreSQL" });
    }
  });

  // CRM API: Add file to client
  app.post("/api/crm/clients/:id/files", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { fileName, fileSize, fileType, fileUrl } = req.body;
      
      if (!fileName || !fileSize) {
        return res.status(400).json({ error: "File name and size are required" });
      }

      const [newFile] = await db.insert(clientFiles).values({
        clientId,
        fileName,
        fileSize,
        fileType: fileType || "application/octet-stream",
        fileUrl: fileUrl || ""
      }).returning();

      res.status(201).json(newFile);
    } catch (error) {
      console.error("Error adding client file:", error);
      res.status(500).json({ error: "Failed to add file in PostgreSQL" });
    }
  });

  // CRM API: Delete file
  app.delete("/api/crm/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(clientFiles).where(eq(clientFiles.id, id));
      res.json({ success: true, message: "Fichier supprimé" });
    } catch (error) {
      console.error("Error deleting CRM file:", error);
      res.status(500).json({ error: "Failed to delete file from PostgreSQL" });
    }
  });

  // CRM API: Submit/Create Quote (Public Devis & Material Estimator)
  app.post("/api/crm/quotes", async (req, res) => {
    try {
      const { 
        clientName, 
        company, 
        email, 
        phone, 
        service, 
        budget, 
        description, 
        totalEst, 
        materials 
      } = req.body;

      if (!email || !clientName || !service) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      // Check if client exists by email
      let clientRecord = await db.query.clients.findFirst({
        where: eq(clients.email, email)
      });

      // If client doesn't exist, create profile
      if (!clientRecord) {
        const [newClient] = await db.insert(clients).values({
          name: clientName,
          company: company || "Particulier",
          email,
          phone: phone || "",
          notes: `Créé automatiquement lors de la soumission de devis pour : ${service}.`
        }).returning();
        clientRecord = newClient;
      } else {
        // Optionally update phone if it was blank and user provided it
        if (!clientRecord.phone && phone) {
          await db.update(clients).set({ phone }).where(eq(clients.id, clientRecord.id));
          clientRecord.phone = phone;
        }
      }

      // Insert Quote
      const [newQuote] = await db.insert(quotes).values({
        clientId: clientRecord.id,
        service,
        budget: budget || "",
        description: description || "",
        totalEst: totalEst ? parseInt(totalEst) : null,
        status: "new",
        materials: materials ? (typeof materials === 'string' ? materials : JSON.stringify(materials)) : null
      }).returning();

      res.status(201).json({ success: true, quote: newQuote, client: clientRecord });
    } catch (error) {
      console.error("Error submitting quote to PostgreSQL:", error);
      res.status(500).json({ error: "Failed to submit quote to PostgreSQL" });
    }
  });

  // CRM API: Update Quote
  app.put("/api/crm/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, budget, totalEst, service, description } = req.body;

      const [updatedQuote] = await db.update(quotes)
        .set({
          status,
          budget,
          totalEst: totalEst ? parseInt(totalEst) : undefined,
          service,
          description
        })
        .where(eq(quotes.id, id))
        .returning();

      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating CRM quote:", error);
      res.status(500).json({ error: "Failed to update quote in PostgreSQL" });
    }
  });

  // CRM API: Delete Quote
  app.delete("/api/crm/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(quotes).where(eq(quotes.id, id));
      res.json({ success: true, message: "Devis supprimé" });
    } catch (error) {
      console.error("Error deleting CRM quote:", error);
      res.status(500).json({ error: "Failed to delete quote in PostgreSQL" });
    }
  });

  // AI Logic for Auto-Detection
  app.post("/api/analyze-plan", async (req, res) => {
    try {
      const { image } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key missing" });
      }

      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Analyze this architectural plan. Identify optimal locations for CCTV cameras (corners, entrances), WiFi Access Points (central areas), and smoke detectors. 
      Return a JSON array of objects with { type, x_percent, y_percent, reason }. 
      Types: CCTV, WIFI, FIRE. 
      Only return the JSON.`;

      // Remove data:image/png;base64, prefix
      const base64Data = image.split(',')[1];

      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      };

      const textPart = {
        text: prompt
      };

      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] }
      });

      const text = response.text || "";
      
      // Basic JSON extraction
      const jsonMatch = text.match(/\[.*\]/s);
      const detections = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      res.json({ detections });
    } catch (error: any) {
      console.error(error);
      if (error.status === 503 || error.code === 503 || error.message?.includes('503')) {
        res.status(503).json({ error: "AI service is currently experiencing high demand. Please try again in a moment." });
      } else {
        res.status(500).json({ error: "AI Analysis failed" });
      }
    }
  });

  // AI Chatbot endpoint for corporate site
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key missing" });
      }

      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const formattedContents = [
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: "Tu es l'assistant virtuel IA de l'entreprise technologique Voltplan. Tu es un expert en informatique, réseaux, télécoms, vidéosurveillance et cybersécurité. Ton rôle est d'accueillir les visiteurs, répondre à leurs questions techniques de manière simple et rassurante, les guider vers nos services appropriés, et les aider à formuler une demande de devis en les qualifiant poliment. Sois professionnel, concis et amical. Réponds dans la même langue que le visiteur (Français ou Anglais)."
        }
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // PDF Encryption endpoint
  app.post("/api/encrypt-pdf", async (req, res) => {
    try {
      const { pdfBase64, password } = req.body;
      if (!pdfBase64 || !password) {
        return res.status(400).json({ error: "PDF content and password are required" });
      }

      // Convert base64 to buffer
      const inputBuffer = Buffer.from(pdfBase64, 'base64');
      const outputBuffer = Buffer.alloc(0);

      // muhammara uses a different stream-based or file-based approach
      // We'll use a temporary file path approach since muhammara's Recipe often works best with paths
      const tempInput = path.join(process.cwd(), `temp_in_${Date.now()}.pdf`);
      const tempOutput = path.join(process.cwd(), `temp_out_${Date.now()}.pdf`);

      const fs = await import('fs/promises');
      await fs.writeFile(tempInput, inputBuffer);

      // Use Recipe API from muhammara
      const recipe = new muhammara.Recipe(tempInput, tempOutput);
      recipe
        .encrypt({
          userPassword: password,
          ownerPassword: 'voltplan_admin_' + Math.random().toString(36).substring(7),
          userProtectionFlag: 4 // This allows printing and copying by default if following standard PDF flags, 
          // or we can omit permissions if uncertain about the exact flag mapping in this version.
        })
        .endPDF();

      const encryptedBuffer = await fs.readFile(tempOutput);
      const encryptedBase64 = encryptedBuffer.toString('base64');

      // Clean up
      await fs.unlink(tempInput);
      await fs.unlink(tempOutput);

      res.json({ encryptedBase64 });
    } catch (error: any) {
      console.error("PDF Encryption error:", error);
      res.status(500).json({ error: "Failed to encrypt PDF: " + error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
