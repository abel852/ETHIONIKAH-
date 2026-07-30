const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const { uploadMulterFile, isR2Enabled } = require("../config/r2");

// === ADMIN: Create a book (with file upload) ===
exports.createBook = async (req, res) => {
  try {
    const { title, author, description, price, category } = req.body;
    if (!title || !author) return res.status(400).json({ error: "Title and author are required" });

    let fileUrl;
    if (req.file) {
      if (isR2Enabled) {
        fileUrl = await uploadMulterFile(req.file, "books");
      } else {
        fileUrl = `/uploads/books/${req.file.filename}`;
      }
    }
    if (!fileUrl) return res.status(400).json({ error: "Book file is required" });

    const ext = path.extname(req.file.filename).toLowerCase().replace(".", "");
    const coverImage = req.body.coverImage || null;

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description: description || null,
        price: parseFloat(price) || 0,
        category: category || null,
        fileUrl,
        fileType: ext,
        coverImage,
        createdBy: req.user.userId,
      },
    });

    res.status(201).json({ message: "Book uploaded successfully", book });
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({ error: "Failed to upload book" });
  }
};

// === ADMIN: List all books ===
exports.listBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { purchases: true } } },
    });
    res.json({ books });
  } catch (error) {
    console.error("List books error:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
};

// === ADMIN: Update a book ===
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, price, category, isActive } = req.body;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(author !== undefined && { author }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
      },
    });

    res.json({ message: "Book updated", book: updated });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
};

// === ADMIN: Delete a book ===
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Delete file from disk
    const filePath = path.join(__dirname, "..", "..", book.fileUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.book.delete({ where: { id } });
    res.json({ message: "Book deleted" });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
};

// === USER: List available books ===
exports.listAvailableBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverImage: true,
        price: true,
        currency: true,
        category: true,
        fileType: true,
        createdAt: true,
      },
    });

    // Get user's purchased book IDs
    const purchases = await prisma.bookPurchase.findMany({
      where: { userId: req.user.userId, status: "approved" },
      select: { bookId: true },
    });
    const purchasedIds = new Set(purchases.map((p) => p.bookId));

    const booksWithAccess = books.map((b) => ({
      ...b,
      isPurchased: purchasedIds.has(b.id),
    }));

    res.json({ books: booksWithAccess });
  } catch (error) {
    console.error("List available books error:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
};

// === USER: Purchase a book (creates payment request via standard flow) ===
exports.purchaseBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book || !book.isActive) return res.status(404).json({ error: "Book not found" });

    // Check if already purchased
    const existing = await prisma.bookPurchase.findUnique({
      where: { userId_bookId: { userId, bookId: id } },
    });
    if (existing) return res.status(400).json({ error: "You already own this book" });

    // Free book — just create purchase record
    if (book.price === 0) {
      const purchase = await prisma.bookPurchase.create({
        data: { userId, bookId: id, amount: 0 },
      });
      return res.json({ message: "Book unlocked", purchase, free: true });
    }

    // Paid book — return book info so frontend can redirect to payment flow
    res.json({
      message: "Payment required to unlock this book",
      paymentRequired: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        currency: book.currency,
      },
      planType: `book:${book.id}`,
    });
  } catch (error) {
    console.error("Purchase book error:", error);
    res.status(500).json({ error: "Failed to purchase book" });
  }
};

// === USER: Read a book (only if purchased or free) ===
exports.readBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book || !book.isActive) return res.status(404).json({ error: "Book not found" });

    // Check if user has access
    if (book.price > 0) {
      const purchase = await prisma.bookPurchase.findUnique({
        where: { userId_bookId: { userId, bookId: id } },
      });
      if (!purchase || purchase.status !== "approved") {
        return res.status(403).json({ error: "You need to purchase this book to read it" });
      }
    }

    res.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        fileUrl: book.fileUrl,
        fileType: book.fileType,
      },
    });
  } catch (error) {
    console.error("Read book error:", error);
    res.status(500).json({ error: "Failed to access book" });
  }
};

// === USER: List my purchased books ===
exports.myBooks = async (req, res) => {
  try {
    const purchases = await prisma.bookPurchase.findMany({
      where: { userId: req.user.userId, status: "approved" },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            description: true,
            coverImage: true,
            fileType: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ books: purchases.map((p) => ({ ...p.book, purchasedAt: p.createdAt })) });
  } catch (error) {
    console.error("My books error:", error);
    res.status(500).json({ error: "Failed to fetch your books" });
  }
};
