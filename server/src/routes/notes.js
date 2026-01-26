const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

function parsePosition(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

router.get("/", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(notes);
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch notes" });
  }
});

router.post("/", async (req, res) => {
  const { content = "", color = "yellow", posX = 10, posY = 10 } = req.body;

  try {
    const note = await prisma.note.create({
      data: {
        content,
        color,
        posX: parsePosition(posX, 0),
        posY: parsePosition(posY, 0),
        userId: req.user.id,
      },
    });
    return res.status(201).json(note);
  } catch (err) {
    return res.status(500).json({ message: "Unable to create note" });
  }
});

router.put("/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  const { content, color, posX, posY } = req.body;

  if (Number.isNaN(noteId)) {
    return res.status(400).json({ message: "Invalid note id" });
  }

  try {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Note not found" });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        content: content ?? existing.content,
        color: color ?? existing.color,
        posX: posX !== undefined ? parsePosition(posX, existing.posX) : existing.posX,
        posY: posY !== undefined ? parsePosition(posY, existing.posY) : existing.posY,
      },
    });

    return res.json(note);
  } catch (err) {
    return res.status(500).json({ message: "Unable to update note" });
  }
});

router.delete("/:id", async (req, res) => {
  const noteId = Number(req.params.id);

  if (Number.isNaN(noteId)) {
    return res.status(400).json({ message: "Invalid note id" });
  }

  try {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.delete({ where: { id: noteId } });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: "Unable to delete note" });
  }
});

module.exports = router;
