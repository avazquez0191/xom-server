export function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page as string || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(query.limit as string || '25', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
