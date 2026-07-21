function paginatedResponse(rows, total, page, limit) {
    return {
        data: rows,
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(total) / parseInt(limit)) || 1
    };
}

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

module.exports = { paginatedResponse, parsePagination };