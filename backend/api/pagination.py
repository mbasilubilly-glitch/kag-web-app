from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Shared pagination for list endpoints that can grow unbounded (e.g.
    the full user table) - lets a client request a larger page (up to
    max_page_size) via ?page_size=, but never the whole table in one shot."""

    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100
