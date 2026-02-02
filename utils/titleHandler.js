module.exports = {
  ConvertTitleToSlug: function (title) {
    if (typeof title !== "string") return "";

    let slug = title
      .trim()
      .toLowerCase()
      // bỏ dấu tiếng Việt
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      // thay mọi ký tự không phải chữ/số bằng dấu -
      .replace(/[^a-z0-9]+/g, "-")
      // gộp nhiều dấu - liên tiếp
      .replace(/-+/g, "-")
      // bỏ - ở đầu/cuối
      .replace(/^-|-$/g, "");

    return slug;
  }
};
