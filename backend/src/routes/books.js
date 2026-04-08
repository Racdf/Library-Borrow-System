const express = require("express");
const { PrismaClient } = require("@prisma/client");
const verifyToken = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { q } = req.query;
  
  try {
    const whereClause = { deletedAt: null };
    if (q) {
      whereClause.OR = [
        { title: { contains: q, } }, 
        { author: { contains: q, } }
      ];
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { copies: true }, 
        },
        copies: {
          where: { status: "AVAILABLE", deletedAt: null },
          select: { id: true }
        }
      }
    });

    const formatted = books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverImage: b.coverImage,
      totalCopies: b._count.copies,
      availableCopies: b.copies.length
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my-records", verifyToken, async (req, res) => {
  try {
    const records = await prisma.borrowRecord.findMany({
      where: { userId: req.user.userId, deletedAt: null },
      include: { physicalCopy: { include: { book: true } } }
    });
    
    const formatted = records.map(r => ({
      id: r.id,
      bookId: r.physicalCopy.bookId,
      title: r.physicalCopy.book.title,
      borrowDate: r.borrowDate,
      dueDate: r.dueDate,
      returnDate: r.returnDate,
      status: r.status,
      fineAmount: r.fineAmount
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/borrow", verifyToken, async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.userId;
  const idempotencyKey = req.headers['idempotency-key'];

  try {
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key header missing" });
    }

    const cachedResponse = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });
    if (cachedResponse) {
      return res.json(cachedResponse.response);
    }

    const activeLoans = await prisma.borrowRecord.count({
      where: { userId, status: "BORROWED", deletedAt: null }
    });

    if (activeLoans >= 10) {
      return res.status(400).json({ error: "You reached the maximum limit of 10 borrowed books." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const availableCopy = await tx.physicalCopy.findFirst({
        where: { bookId, status: "AVAILABLE", deletedAt: null },
      });

      if (!availableCopy) {
        throw new Error("No available copies. Consider waitlisting.");
      }

      const claimedCopy = await tx.physicalCopy.update({
        where: { id: availableCopy.id, status: "AVAILABLE" },
        data: { status: "BORROWED" }
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const record = await tx.borrowRecord.create({
        data: {
          physicalCopyId: claimedCopy.id,
          userId,
          dueDate,
          status: "BORROWED",
        },
      });

      return { record, physicalCopyId: claimedCopy.id };
    });

    const successResponse = { message: "Book borrowed successfully", result };

    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId,
        path: req.originalUrl || "/api/books/borrow",
        response: successResponse
      }
    });

    res.json(successResponse);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ error: error.message || "Failed to borrow book" });
  }
});

router.post("/return", verifyToken, async (req, res) => {
  const { recordId } = req.body;
  const userId = req.user.userId;
  const idempotencyKey = req.headers['idempotency-key'];

  try {
    if (idempotencyKey) {
      const cachedResponse = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (cachedResponse) return res.json(cachedResponse.response);
    }

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.borrowRecord.findUnique({ 
        where: { id: recordId },
        include: { physicalCopy: true }
      });

      if (!record || record.deletedAt) throw new Error("Borrow record not found");
      if (record.userId !== userId) throw new Error("Unauthorized to return this item");
      if (record.status === "RETURNED") throw new Error("Book already returned");

      const now = new Date();
      let fineAmount = 0;
      if (now > record.dueDate) {
        const diffTime = Math.abs(now - record.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        fineAmount = diffDays * 10;
      }

      const updatedRecord = await tx.borrowRecord.update({
        where: { id: recordId },
        data: { status: "RETURNED", returnDate: now, fineAmount },
      });

      const pendingReservation = await tx.reservation.findFirst({
        where: { bookId: record.physicalCopy.bookId, status: "PENDING" },
        orderBy: { createdAt: "asc" }
      });

      let nextCopyStatus = "AVAILABLE";
      if (pendingReservation) {
        nextCopyStatus = "RESERVED";
        await tx.reservation.update({
          where: { id: pendingReservation.id },
          data: { status: "FULFILLED" } 
        });
      }

      const updatedCopy = await tx.physicalCopy.update({
        where: { id: record.physicalCopy.id },
        data: { status: nextCopyStatus },
      });

      return { record: updatedRecord, copyStatus: updatedCopy.status };
    });

    const successResponse = { message: "Book returned successfully", result };

    if (idempotencyKey) {
      await prisma.idempotencyKey.create({
        data: { key: idempotencyKey, userId, path: req.originalUrl, response: successResponse }
      });
    }

    res.json(successResponse);
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post("/reserve", verifyToken, async (req, res) => {
  const { bookId } = req.body;
  const userId = req.user.userId;

  try {
     const book = await prisma.book.findUnique({ where: { id: bookId, deletedAt: null } });
     if (!book) return res.status(404).json({ error: "Book not found" });

     const existingRes = await prisma.reservation.findFirst({
       where: { bookId, userId, status: "PENDING" }
     });
     if (existingRes) return res.status(400).json({ error: "Already waitlised for this book" });

     const reservation = await prisma.reservation.create({
       data: { userId, bookId, status: "PENDING" }
     });

     res.json({ message: "Successfully joined waitlist", reservation });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
