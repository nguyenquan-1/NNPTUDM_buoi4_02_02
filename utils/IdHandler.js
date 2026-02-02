module.exports = {
  getMaxID: function (data) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    let ids = data
      .map(e => Number(e.id))
      .filter(n => !Number.isNaN(n));

    return ids.length ? Math.max(...ids) : 0;
  }
};
