const express = require("express");
const prisma = require("../prismaClient");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(auth);

const NOTE_WIDTH_RANGE = { min: 180, max: 440 };
const NOTE_HEIGHT_RANGE = { min: 150, max: 360 };
const FONT_SIZE_RANGE = { min: 12, max: 24 };

function clampNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function parsePosition(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseDimension(value, fallback, range) {
  return clampNumber(value, fallback, range.min, range.max);
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
  const {
    content = "",
    color = "yellow",
    posX = 10,
    posY = 10,
    width = 256,
    height = 180,
    fontSize = 16,
  } = req.body;

  try {
    const note = await prisma.note.create({
      data: {
        content,
        color,
        posX: parsePosition(posX, 0),
        posY: parsePosition(posY, 0),
        width: parseDimension(width, 256, NOTE_WIDTH_RANGE),
        height: parseDimension(height, 180, NOTE_HEIGHT_RANGE),
        fontSize: parseDimension(fontSize, 16, FONT_SIZE_RANGE),
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
  const { content, color, posX, posY, width, height, fontSize } = req.body;

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
        width:
          width !== undefined
            ? parseDimension(width, existing.width, NOTE_WIDTH_RANGE)
            : existing.width,
        height:
          height !== undefined
            ? parseDimension(height, existing.height, NOTE_HEIGHT_RANGE)
            : existing.height,
        fontSize:
          fontSize !== undefined
            ? parseDimension(fontSize, existing.fontSize, FONT_SIZE_RANGE)
            : existing.fontSize,
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
