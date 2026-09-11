-- Restrict writable columns on the direct Data API path as well as application routes.
-- Table-level privileges would override column restrictions, so revoke them first.
revoke insert, update on public.documents from authenticated;
grant insert (owner_id, body) on public.documents to authenticated;
grant update (body) on public.documents to authenticated;
