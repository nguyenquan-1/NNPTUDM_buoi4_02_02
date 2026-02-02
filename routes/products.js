var express = require('express');
var router = express.Router();

let { ConvertTitleToSlug } = require('../utils/titleHandler');
let { getMaxID } = require('../utils/IdHandler');

// ===== DATA (giữ hoặc thay bằng MongoDB sau) =====
let data = [
  { id: 1, title: "Điện thoại Samsung", slug: "dien-thoai-samsung", price: 100, description: "Mô tả", category: {}, images: [], creationAt: new Date(), updatedAt: new Date() },
  { id: 2, title: "Iphone 15 Pro", slug: "iphone-15-pro", price: 200, description: "Mô tả", category: {}, images: [], creationAt: new Date(), updatedAt: new Date() }
];

// ===== Helpers =====
function isEmpty(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function parsePositiveInt(value, defaultVal) {
  if (value === undefined) return defaultVal;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseNumber(value, defaultVal) {
  if (value === undefined) return defaultVal;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

// ===== Middleware validate POST =====
function validatePostBody(req, res, next) {
  const { title, price, description, category, images } = req.body;

  if (isEmpty(title)) return res.status(400).send({ message: "title không được để trống" });
  if (isEmpty(description)) return res.status(400).send({ message: "description không được để trống" });

  if (price === undefined || price === null || price === "") {
    return res.status(400).send({ message: "price không được để trống" });
  }

  const priceNum = Number(price);
  if (Number.isNaN(priceNum)) return res.status(400).send({ message: "price phải là số" });

  // (tuỳ yêu cầu môn) bắt buộc category/images
  if (category === undefined || category === null) {
    return res.status(400).send({ message: "category không được để trống" });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).send({ message: "images phải là mảng và không được rỗng" });
  }

  // Chuẩn hoá lại
  req.body.title = String(title).trim();
  req.body.description = String(description).trim();
  req.body.price = priceNum;

  next();
}

// =======================================================
// 1) GET /products?title=&minPrice=&maxPrice=&page=&limit=
//    - validate page/limit
//    - validate maxPrice >= minPrice
// =======================================================
router.get('/', function (req, res) {
  let q = req.query;

  let titleQ = q.title ? String(q.title) : '';

  let minPrice = parseNumber(q.minPrice, 0);
  if (minPrice === null) return res.status(400).send({ message: "minPrice phải là số" });

  let maxPrice = parseNumber(q.maxPrice, 1e6);
  if (maxPrice === null) return res.status(400).send({ message: "maxPrice phải là số" });

  if (maxPrice < minPrice) {
    return res.status(400).send({ message: "maxPrice phải >= minPrice" });
  }

  let page = parsePositiveInt(q.page, 1);
  if (page === null) return res.status(400).send({ message: "page phải là số nguyên dương" });

  let limit = parsePositiveInt(q.limit, 10);
  if (limit === null) return res.status(400).send({ message: "limit phải là số nguyên dương" });

  let result = data.filter(e =>
    !e.isDeleted &&
    e.title.includes(titleQ) &&
    e.price >= minPrice && e.price <= maxPrice
  );

  const start = limit * (page - 1);
  result = result.slice(start, start + limit);

  res.send(result);
});

// =======================================================
// 2) GET /products/slug/:slug  (CHECK EQUAL)
// =======================================================
router.get('/slug/:slug', function (req, res) {
  const slug = String(req.params.slug).trim();

  let result = data.find(e => e.slug === slug && !e.isDeleted);
  if (!result) return res.status(404).send({ message: "slug not found" });

  res.send(result);
});

// =======================================================
// 3) GET /products/:id   (chỉ nhận số)
// =======================================================
router.get('/:id(\\d+)', function (req, res) {
  let result = data.find(e => e.id == req.params.id && !e.isDeleted);
  if (!result) return res.status(404).send({ message: "id not found" });
  res.send(result);
});

// =======================================================
// 4) POST /products  (validate + tạo slug)
// =======================================================
router.post('/', validatePostBody, function (req, res) {
  // tạo slug từ title (bỏ dấu + ký tự đặc biệt)
  const slug = ConvertTitleToSlug(req.body.title);

  let newObj = {
    id: getMaxID(data) + 1,
    title: req.body.title,
    slug: slug,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    images: req.body.images,
    creationAt: new Date(),
    updatedAt: new Date()
  };

  data.push(newObj);
  res.send(newObj);
});

// =======================================================
// 5) PUT /products/:id  (nếu update title -> update slug)
// =======================================================
router.put('/:id(\\d+)', function (req, res) {
  let id = req.params.id;
  let result = data.find(e => e.id == id && !e.isDeleted);
  if (!result) return res.status(404).send({ message: "id not found" });

  // validate price nếu có
  if (req.body.price !== undefined) {
    const p = Number(req.body.price);
    if (Number.isNaN(p)) return res.status(400).send({ message: "price phải là số" });
    result.price = p;
  }

  // update title -> slug
  if (req.body.title !== undefined) {
    if (isEmpty(req.body.title)) return res.status(400).send({ message: "title không được để trống" });
    result.title = String(req.body.title).trim();
    result.slug = ConvertTitleToSlug(result.title);
  }

  if (req.body.description !== undefined) {
    if (isEmpty(req.body.description)) return res.status(400).send({ message: "description không được để trống" });
    result.description = String(req.body.description).trim();
  }

  if (req.body.category !== undefined) {
    result.category = req.body.category;
  }

  if (req.body.images !== undefined) {
    if (!Array.isArray(req.body.images) || req.body.images.length === 0) {
      return res.status(400).send({ message: "images phải là mảng và không được rỗng" });
    }
    result.images = req.body.images;
  }

  result.updatedAt = new Date();
  res.send(result);
});

// =======================================================
// 6) DELETE /products/:id (soft delete)
// =======================================================
router.delete('/:id(\\d+)', function (req, res) {
  let id = req.params.id;
  let result = data.find(e => e.id == id && !e.isDeleted);
  if (!result) return res.status(404).send({ message: "id not found" });

  result.isDeleted = true;
  result.updatedAt = new Date();
  res.send(result);
});

module.exports = router;
