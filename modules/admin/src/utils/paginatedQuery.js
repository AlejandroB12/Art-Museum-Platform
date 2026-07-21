async function paginatedQuery(queryFn, countQuery, params, page, limit) {
    const offset = (page - 1) * limit;
    const [rows, countResult] = await Promise.all([
        queryFn(params, limit, offset),
        countQuery(params)
    ]);
    const total = parseInt(countResult[0]?.count || 0);
    return {
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
    };
}

module.exports = { paginatedQuery };