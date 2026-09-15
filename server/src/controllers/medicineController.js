const Medicine = require("../models/Medicine");

// GET /api/medicines?search=para - any authenticated role can browse the pharmacy catalog
async function listMedicines(req, res, next) {
  try {
    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.category) filter.category = req.query.category;

    const medicines = await Medicine.find(filter).sort({ name: 1 });
    res.json(medicines);
  } catch (err) {
    next(err);
  }
}

// GET /api/medicines/:id
async function getMedicine(req, res, next) {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: "Medicine not found" });
    res.json(medicine);
  } catch (err) {
    next(err);
  }
}

// POST /api/medicines - admin only
async function createMedicine(req, res, next) {
  try {
    const { name, category, manufacturer, unit, price, stock, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: "name and price are required" });
    }
    const medicine = await Medicine.create({
      name,
      category,
      manufacturer,
      unit,
      price,
      stock,
      description,
    });
    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/medicines/:id - admin only
async function updateMedicine(req, res, next) {
  try {
    const { name, category, manufacturer, unit, price, stock, description } = req.body;
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { name, category, manufacturer, unit, price, stock, description },
      { new: true, runValidators: true }
    );
    if (!medicine) return res.status(404).json({ error: "Medicine not found" });
    res.json(medicine);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/medicines/:id - admin only
async function deleteMedicine(req, res, next) {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ error: "Medicine not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
